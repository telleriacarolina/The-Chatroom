import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client: Twilio.Twilio | null = null;
if (accountSid && authToken) {
  client = Twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string) {
  if (!client || !fromNumber) {
    console.warn('Twilio not configured; SMS not sent', { to, body });
    return null;
  }

  return client.messages.create({ to, from: fromNumber, body });
}

export default sendSms;
