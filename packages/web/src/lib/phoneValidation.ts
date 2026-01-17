/**
 * Phone number validation utilities
 */

/**
 * Validates a phone number
 * Basic validation - checks if it's a valid format
 * Supports formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if phone has at least 10 digits (minimum for most international formats)
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }

  // Check if phone has too many digits (max 15 for international)
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  return { isValid: true };
}

/**
 * Formats a phone number for display
 * Converts to (XXX) XXX-XXXX format for 10-digit US numbers
 */
export function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }

  return phone; // Return original if not standard format
}

/**
 * Normalizes a phone number to digits only
 * Useful for sending to API
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
