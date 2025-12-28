export interface TempSession {
  id: string;
  userId?: string | null;
  temporaryUsername: string; // 4-10 chars
  ageCategory: '18+' | '18+RED';
  sessionToken?: string;
  expiresAt: string; // ISO date-time
  createdAt: string; // ISO date-time
}

export default TempSession;
