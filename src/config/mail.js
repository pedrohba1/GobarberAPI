export default {
    host: 'smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
        user: '9eed8da2eae567',
        pass: '935513d4f09074',
    },
    default: {
        from: 'Equipe GoBarber <noreply@gobarber.com>',
    },
};

// tipos de serviço de envio de email para uso:
// AMAZON SE
// MAILGUN
// Sparkspot
// Mandril
// Mailchimp
// Mailtrap -> funciona apenas para ambiente de desenvolvimento
