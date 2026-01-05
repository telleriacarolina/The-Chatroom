// Shared utility functions

/**
 * Merge class names safely
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter((c): c is string => Boolean(c) && typeof c === 'string')
    .join(' ');
}

/**
 * Generate a random ID
 */
export function generateId(prefix = ''): string {
  const id = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number format (simple)
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?1?\d{9,15}$/.test(phone.replace(/\D/g, ''));
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

/**
 * Sleep for specified milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
