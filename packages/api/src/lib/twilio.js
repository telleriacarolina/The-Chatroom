function createSmsSender({
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
  fromNumber = process.env.TWILIO_FROM_NUMBER,
  twilioFactory
} = {}) {
  const resolvedFactory = twilioFactory || (() => {
    try {
      return require('twilio');
    } catch (_) {
      return null;
    }
  })();
  const client = accountSid && authToken && resolvedFactory ? resolvedFactory(accountSid, authToken) : null;

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
