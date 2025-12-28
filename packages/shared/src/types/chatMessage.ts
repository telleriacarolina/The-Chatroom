export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'SYSTEM';
export type ModerationStatus = 'APPROVED' | 'PENDING' | 'REMOVED';

export interface ChatMessage {
  id: string;
  loungeId: string;
  languageRoomId: string;
  userId: string;
  displayUsername: string;
  messageText: string;
  messageType: MessageType;
  attachmentUrl?: string | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  flagCount?: number;
  isFlagged?: boolean;
  moderationStatus?: ModerationStatus;
  createdAt: string;
}

export default ChatMessage;
