// Type definitions for The Chatroom

export interface User {
  id: string;
  phoneNumber?: string;
  permanentUsername?: string;
  displayName?: string;
  accountType: 'GUEST' | 'REGISTERED';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  ageCategory?: 'ADULT' | 'TEEN' | 'UNVERIFIED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface TempSession {
  id: string;
  temporaryUsername: string;
  ageCategory: '_18PLUS' | '_18PLUS_RED';
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  tempSessionId?: string;
  roomId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lounge {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface LanguageRoom {
  id: string;
  language: string;
  loungeId: string;
  memberCount: number;
}

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}
