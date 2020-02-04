import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'invalid json' });
        }

        const { provider_id, date } = req.body;

        // checa se o provider_id é um provedor de serviço

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

        return res.json(appointment);
    }
}

export default new AppointmentController();
