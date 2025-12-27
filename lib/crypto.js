import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.PHONE_ENC_KEY || process.env.ENCRYPTION_KEY || 'dev_key_32_byte_length_needed_!';

function getKey() {
  // ensure 32 bytes
  return crypto.createHash('sha256').update(String(KEY)).digest();
}

export function encryptPhone(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptPhone(payload) {
  if (!payload) return null;
  const [ivB, tagB, dataB] = String(payload).split(':');
  if (!ivB || !tagB || !dataB) return null;
  const iv = Buffer.from(ivB, 'base64');
  const tag = Buffer.from(tagB, 'base64');
  const data = Buffer.from(dataB, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
