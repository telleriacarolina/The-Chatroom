import Twilio from 'twilio';

type SenderConfig = {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  twilioFactory?: typeof Twilio;
};

export function createSmsSender({
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
  fromNumber = process.env.TWILIO_FROM_NUMBER,
  twilioFactory,
}: SenderConfig = {}) {
  const resolvedFactory = twilioFactory || Twilio;
  const client = accountSid && authToken && resolvedFactory ? resolvedFactory(accountSid, authToken) : null;

  return async function sendSms(to: string, body: string) {
    if (!to || !body) {
      throw new Error('SMS destination and body are required');
    }

    if (!client || !fromNumber) {
      throw new Error('Twilio is not configured');
    }

    return client.messages.create({ to, from: fromNumber, body });
  };
}

export const sendSms = createSmsSender();

export default sendSms;
