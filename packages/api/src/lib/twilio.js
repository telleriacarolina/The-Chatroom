const Twilio = require('twilio');

function createSmsSender({
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
  fromNumber = process.env.TWILIO_FROM_NUMBER,
  twilioFactory = Twilio
} = {}) {
  const client = accountSid && authToken ? twilioFactory(accountSid, authToken) : null;

  return async function sendSms(to, body) {
    if (!to || !body) {
      throw new Error('SMS destination and body are required');
    }

    if (!client || !fromNumber) {
      throw new Error('Twilio is not configured');
    }

    return client.messages.create({ to, from: fromNumber, body });
  };
}

const sendSms = createSmsSender();

module.exports = { sendSms, createSmsSender };
