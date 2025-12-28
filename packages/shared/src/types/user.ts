export type AccountType = 'REGISTERED' | 'GUEST';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

/**
 * User record shape. For `REGISTERED` accounts, `email`, `passwordHash`,
 * and `permanentUsername` must be present and unique.
 */
export interface User {
  id: string; // RECORD_ID
  email?: string; // required for registered users
  passwordHash?: string; // bcrypt/argon2
  permanentUsername?: string; // 4-20 chars
  preferredName?: string;
  avatarUrl?: string;
  accountType: AccountType;
  ageVerified?: boolean;
  idVerified?: boolean;
  idVerificationDate?: string | null;
  idVerificationProvider?: string | null;
  dateOfBirth?: string | null; // sensitive, encrypt at rest
  accountStatus?: AccountStatus;
  banReason?: string | null;
  banExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  stayOnline?: boolean;
  stayOnlineUntil?: string | null;
}

export default User;
