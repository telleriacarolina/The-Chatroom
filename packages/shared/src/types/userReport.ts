export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'UNDERAGE' | 'SCAM' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED';

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId?: string | null;
  reportedMessageId?: string | null;
  reportedItemId?: string | null;
  reportReason: ReportReason;
  reportDetails?: string | null;
  status?: ReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export default UserReport;
