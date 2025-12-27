export type AccessLevel = '18+' | '18+RED';

export interface Lounge {
  id: string;
  name: string;
  slug: string;
  description: string;
  accessLevel: AccessLevel;
  iconColor?: string | null; // hex color
  isActive?: boolean;
  maxCapacity?: number | null;
  currentUserCount?: number;
  createdAt: string;
}

export default Lounge;
