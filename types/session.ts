export interface Session {
  id: string; // RECORD_ID
  userId: string; // linked to `User.id`
  sessionToken: string; // JWT or UUID
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive?: boolean;
  expiresAt: string; // ISO date-time
  createdAt: string; // ISO date-time
  lastActivityAt?: string | null; // ISO date-time
  stayOnlineEnabled?: boolean;
}

export default Session;
