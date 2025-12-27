export type ModerationActionType =
  | 'WARNING'
  | 'MUTE'
  | 'KICK'
  | 'BAN_TEMP'
  | 'BAN_PERMANENT'
  | 'MESSAGE_DELETE'
  | 'ITEM_REMOVE';

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetUserId?: string | null;
  targetMessageId?: string | null;
  targetItemId?: string | null;
  actionType: ModerationActionType;
  reason: string;
  duration?: number | null; // minutes
  expiresAt?: string | null;
  isActive?: boolean;
  createdAt: string;
}

export default ModerationAction;
