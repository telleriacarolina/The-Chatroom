export type VerificationType = 'AGE_ONLY' | 'ID_FULL';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type DocumentType = 'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'STATE_ID';

export interface Verification {
  id: string;
  userId: string;
  verificationType: VerificationType;
  verificationStatus: VerificationStatus;
  documentType: DocumentType;
  documentImageUrl: string; // encrypted at rest
  selfieImageUrl: string; // encrypted at rest
  verificationProvider?: string | null;
  verificationProviderResponse?: string | null; // encrypted raw response
  verifiedAt?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default Verification;
