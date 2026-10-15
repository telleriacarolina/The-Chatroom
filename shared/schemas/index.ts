export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 25;

const REDACTED_KEYS = new Set([
  'authorization',
  'authheader',
  'cookie',
  'set-cookie',
  'password',
  'pass',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'phonenumber',
  'phone',
  'content',
  'messagetext',
  'newcontent',
  'body',
  'rawbody'
]);

export function sanitizeLogData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value
      .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED]')
      .replace(/(authorization\s*[:=]\s*)([^,\s]+)/gi, '$1[REDACTED]')
      .replace(/(password\s*[:=]\s*)([^,\s]+)/gi, '$1[REDACTED]')
      .replace(/(token\s*[:=]\s*)([^,\s]+)/gi, '$1[REDACTED]')
      .replace(/(cookie\s*[:=]\s*)([^;\s]+)/gi, '$1[REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogData(entry, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('authorization') || lowerKey.includes('token') || lowerKey.includes('password') || lowerKey.includes('cookie') || lowerKey.includes('secret') || lowerKey.includes('phonenumber') || lowerKey.includes('content') || lowerKey.includes('body')) {
        result[key] = '[REDACTED]';
        continue;
      }
      result[key] = sanitizeLogData(entry, seen);
    }
    return result;
  }

  return value;
}

function isValidType(value: unknown, type: string): boolean {
  if (type === 'string') return typeof value === 'string';
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return true;
}

export function validatePayload(payload: Record<string, unknown>, schema: Record<string, any>) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  const errors: string[] = [];
  const sanitizedPayload: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = payload[key];
    const hasValue = Object.prototype.hasOwnProperty.call(payload, key);

    if (rule.required && !hasValue) {
      errors.push(`${key} is required`);
      continue;
    }

    if (!hasValue) {
      continue;
    }

    if (rule.type && !isValidType(value, rule.type)) {
      errors.push(`${key} must be of type ${rule.type}`);
      continue;
    }

    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
      continue;
    }

    if (rule.type === 'string') {
      if (typeof rule.minLength === 'number' && String(value).length < rule.minLength) {
        errors.push(`${key} must be at least ${rule.minLength} characters`);
      }
      if (typeof rule.maxLength === 'number' && String(value).length > rule.maxLength) {
        errors.push(`${key} must not exceed ${rule.maxLength} characters`);
      }
      if (rule.pattern && !(new RegExp(rule.pattern).test(String(value)))) {
        errors.push(`${key} is invalid`);
      }
    }

    if (rule.type === 'number') {
      if (typeof rule.minimum === 'number' && Number(value) < rule.minimum) {
        errors.push(`${key} must be at least ${rule.minimum}`);
      }
      if (typeof rule.maximum === 'number' && Number(value) > rule.maximum) {
        errors.push(`${key} must not exceed ${rule.maximum}`);
      }
    }

    sanitizedPayload[key] = value;
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, value: sanitizedPayload };
}

export const userSchema = {
  signup: {
    phoneNumber: { type: 'string', minLength: 9, maxLength: 20, pattern: '^\\+?1?\\d{9,15}$', required: true },
    firstName: { type: 'string', minLength: 1, maxLength: 50, required: true },
    lastName: { type: 'string', minLength: 1, maxLength: 50, required: true },
    birthYear: { type: 'number', minimum: 1900, maximum: 2023, required: true }
  },
  signin: {
    phoneNumber: { type: 'string', minLength: 9, maxLength: 20, pattern: '^\\+?1?\\d{9,15}$', required: true },
    password: { type: 'string', minLength: 8, required: true },
    staySignedIn: { type: 'boolean' }
  },
  guest: {
    ageCategory: { type: 'string', enum: ['_18PLUS', '_18PLUS_RED'], required: true }
  }
};

export const chatMessageSchema = {
  create: {
    content: { type: 'string', minLength: 1, maxLength: 2000, required: true },
    roomId: { type: 'string', minLength: 1, maxLength: 255 },
    loungeId: { type: 'string', minLength: 1, maxLength: 255 },
    languageRoomId: { type: 'string', minLength: 1, maxLength: 255 },
    userId: { type: 'string', minLength: 1, maxLength: 255 },
    displayUsername: { type: 'string', minLength: 1, maxLength: 50 },
    messageType: { type: 'string', enum: ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM'] }
  },
  edit: {
    messageId: { type: 'string', minLength: 1, maxLength: 255, required: true },
    userId: { type: 'string', minLength: 1, maxLength: 255, required: true },
    newContent: { type: 'string', minLength: 1, maxLength: 2000, required: true },
    loungeId: { type: 'string', minLength: 1, maxLength: 255, required: true }
  },
  delete: {
    messageId: { type: 'string', minLength: 1, maxLength: 255, required: true },
    userId: { type: 'string', minLength: 1, maxLength: 255, required: true },
    loungeId: { type: 'string', minLength: 1, maxLength: 255, required: true }
  }
};

export const roomSchema = {
  create: {
    name: { type: 'string', minLength: 1, maxLength: 100, required: true },
    language: { type: 'string', minLength: 1, maxLength: 50, required: true }
  }
};
