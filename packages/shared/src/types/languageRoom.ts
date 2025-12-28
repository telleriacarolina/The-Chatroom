export interface LanguageRoom {
  id: string;
  loungeId: string;
  languageCode: string; // ISO code, e.g., 'en'
  languageName: string; // display name
  flagEmoji: string;
  currentUserCount?: number;
  isActive?: boolean;
  createdAt: string;
}

export default LanguageRoom;
