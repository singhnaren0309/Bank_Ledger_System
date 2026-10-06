const { emailQueue } = require('./queue.service');

async function sendRegistrationEmail(userEmail, name) {
    await emailQueue.add('email', { type: 'REGISTRATION', payload: { userEmail, name } });
}

async function sendLoginEmail(userEmail, name) {
    await emailQueue.add('email', { type: 'LOGIN', payload: { userEmail, name } });
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    await emailQueue.add('email', { type: 'TRANSACTION_SUCCESS', payload: { userEmail, name, amount, toAccount } });
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    await emailQueue.add('email', { type: 'TRANSACTION_FAILURE', payload: { userEmail, name, amount, toAccount } });
}

module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};