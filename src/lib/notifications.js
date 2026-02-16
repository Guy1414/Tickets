import { Resend } from 'resend';

const resend = new Resend("re_eXGDBWpa_LUbWt8KitcLnDZX9reoeBWmc");

export const notify = (event, data) => {
    console.log(`[Notification Triggered] Event: ${event}`, data);

    switch (event) {
        case 'ticket_created':
            resend.emails.send({
                from: 'onboarding@resend.dev',
                to: '0606guy@gmail.com',
                subject: 'New Ticket',
                html: `<p>New Ticket: ${data.title}</p>`
            });
            console.log(`Email to Admin: Subject: New Ticket: ${data.title}`);
            break;
        case 'message_sent':
            resend.emails.send({
                from: 'onboarding@resend.dev',
                to: '0606guy@gmail.com',
                subject: 'New Message',
                html: `<p>New Message: ${data.title}</p>`
            });
            console.log(`Email to Admin: Subject: New Message on Ticket ${data.ticketId}`);
            break;
        case 'user_signup':
            resend.emails.send({
                from: 'onboarding@resend.dev',
                to: '0606guy@gmail.com',
                subject: 'New User',
                html: `<p>New User: ${data.name}</p>`
            });
            console.log(`Email to Admin: Subject: New User Registration: ${data.name}. Approval needed.`);
            break;
        default:
            break;
    }
};

export default notify;
