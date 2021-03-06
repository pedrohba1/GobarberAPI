import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import CancellationMail from '../jobs/CancellationMail';

import Queue from '../../lib/Queue';

class AppointmentController {
    async index(req, res) {
        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            order: ['date'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'date', 'past', 'cancelable'],
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['url', 'path', 'id'],
                        },
                    ],
                },
            ],
        });

        return res.json(appointments);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'invalid json' });
        }

        const { provider_id, date } = req.body;

        // checa se o provider não está marcando um agendamento para ele mesmo

        if (provider_id === req.userId) {
            return res.status(401).json({ error: 'provider cannot be itself' });
        }

        // checa se o provider_id é true para provedor de serviço

        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true },
        });

        if (!isProvider) {
            return res.status(401).json({
                error: 'you can only create appointments with providers',
            });
        }

        // transforma a data em um objeto javascript
        // e tira dele só a hora.
        const hourStart = startOfHour(parseISO(date));

        // checa se a data está no passado
        if (isBefore(hourStart, new Date())) {
            return res
                .status(400)
                .json({ error: 'past dates are not permitted' });
        }

        // verifica se a data está disponível
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            },
        });

        if (checkAvailability) {
            return res.status(400).json({
                error: 'appointment date is not available',
            });
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date: hourStart,
        });

        // notificar agendamento ao prestador de serviço

        const user = await User.findByPk(req.userId);
        const formattedDate = format(
            hourStart,
            "'dia' dd 'de' MMMM', às ' H:mm'h' ",
            { locale: pt }
        );

        await Notification.create({
            content: `Novo agendamento de ${user.name} para ${formattedDate}`,
            user: provider_id,
        });

        return res.json(appointment);
    }

    async delete(req, res) {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email'],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                },
            ],
        });

        if (appointment.user_id !== req.userId) {
            return res
                .status(401)
                .json({ error: ' you are not the owner of this appointment' });
        }

        const dateWithSub = subHours(appointment.date, 2);

        if (isBefore(dateWithSub, new Date())) {
            return res.status(401).json({
                error: 'you can only cancel appointments two hours in advance',
            });
        }

        appointment.canceled_at = new Date();

        await appointment.save();

        // await Mail.sendMail({
        //     to: `${appointment.provider.name} <${appointment.provider.email}>`,
        //     subject: 'Agendamento cancelado',
        //     template: 'cancellation',
        //     context: {
        //         provider: appointment.provider.name,
        //         user: appointment.user.name,
        //         date: format(
        //             appointment.date,
        //             "'dia' dd 'de' MMMM', às ' H:mm'h' ",
        //             { locale: pt }
        //         ),
        //     },
        // });

        await Queue.add(CancellationMail.key, {
            appointment,
        });

        return res.json(appointment);
    }
}

export default new AppointmentController();
