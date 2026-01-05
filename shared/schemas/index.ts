// Schema definitions for API requests/responses

export const userSchema = {
  signup: {
    phoneNumber: { type: 'string', pattern: '^\\+?1?\\d{9,15}$' },
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    birthYear: { type: 'number', minimum: 1900, maximum: 2023 }
  },
  signin: {
    phoneNumber: { type: 'string', pattern: '^\\+?1?\\d{9,15}$' },
    password: { type: 'string', minLength: 8 },
    staySignedIn: { type: 'boolean' }
  },
  guest: {
    ageCategory: { type: 'string', enum: ['_18PLUS', '_18PLUS_RED'] }
  }
};

export const chatMessageSchema = {
  create: {
    content: { type: 'string', minLength: 1, maxLength: 2000 },
    roomId: { type: 'string' }
  }
};

export const roomSchema = {
  create: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    language: { type: 'string' }
  }
};
