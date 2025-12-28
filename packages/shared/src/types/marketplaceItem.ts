export type Currency = 'USD' | 'EUR' | 'GBP';
export type ItemCategory = 'PHOTOS' | 'VIDEOS' | 'CUSTOM_CONTENT' | 'SERVICES' | 'OTHER';
export type ContentType = 'SFW' | 'NSFW';
export type AccessLevel = 'MAIN_LOUNGE' | 'RED_LOUNGE';
export type ItemStatus = 'ACTIVE' | 'SOLD' | 'REMOVED' | 'PENDING_REVIEW';

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: ItemCategory;
  contentType: ContentType;
  thumbnailUrl: string;
  previewUrls?: string[] | null;
  accessLevel: AccessLevel;
  status?: ItemStatus;
  viewCount?: number;
  purchaseCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default MarketplaceItem;
