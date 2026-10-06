const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { connection } = require('../services/queue.service');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const emailWorker = new Worker('emailQueue', async job => {
    const { type, payload } = job.data;
    switch (type) {
        case 'REGISTRATION': {
            const { userEmail, name } = payload;
            const subject = 'Welcome to Backend Ledger!';
            const text = `Hello ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
            const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;
            await sendEmail(userEmail, subject, text, html);
            break;
        }
        case 'LOGIN': {
            const { userEmail, name } = payload;
            const subject = 'Welcome to Backend Ledger!';
            const text = `Hello ${name},\n\nThank you for logging in at Backend Ledger.\n\nBest regards,\nThe Backend Ledger Team`;
            const html = `<p>Hello ${name},</p><p>Thank you for logging in at Backend Ledger.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
            await sendEmail(userEmail, subject, text, html);
            break;
        }
        case 'TRANSACTION_SUCCESS': {
            const { userEmail, name, amount, toAccount } = payload;
            const subject = 'Transaction Successful!';
            const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
            const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
            await sendEmail(userEmail, subject, text, html);
            break;
        }
        case 'TRANSACTION_FAILURE': {
            const { userEmail, name, amount, toAccount } = payload;
            const subject = 'Transaction Failed';
            const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
            const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;
            await sendEmail(userEmail, subject, text, html);
            break;
        }
    }
}, { connection });

emailWorker.on('failed', (job, err) => {
    console.error(`Email Job ${job.id} failed with error ${err.message}`);
});

module.exports = emailWorker;
