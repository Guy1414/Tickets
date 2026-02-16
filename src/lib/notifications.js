export const notify = (event, data) => {
    console.log(`[Notification Triggered] Event: ${event}`, data);

    // In a real Appwrite setup, you would trigger a Cloud Function or send an email via an Appwrite Execution.
    // Base implementation for user request.

    switch (event) {
        case 'ticket_created':
            console.log(`Email to Admin: Subject: New Ticket: ${data.title}`);
            break;
        case 'message_sent':
            console.log(`Email to Admin: Subject: New Message on Ticket ${data.ticketId}`);
            break;
        case 'user_signup':
            console.log(`Email to Admin: Subject: New User Registration: ${data.name}. Approval needed.`);
            break;
        default:
            break;
    }
};

export default notify;
