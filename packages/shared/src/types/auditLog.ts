export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'VERIFICATION_ATTEMPT'
  | 'MESSAGE_SENT'
  | 'ITEM_PURCHASED'
  | 'MODERATION_ACTION'
  | 'ACCOUNT_DELETED';

export interface AuditLog {
  id: string;
  userId?: string | null;
  eventType: AuditEventType;
  eventDetails?: string | null; // JSON string
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export default AuditLog;
