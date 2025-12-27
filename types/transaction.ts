export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'CRYPTO';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Transaction {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionFee?: number | null;
  sellerPayout?: number | null;
  paymentIntentId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export default Transaction;
