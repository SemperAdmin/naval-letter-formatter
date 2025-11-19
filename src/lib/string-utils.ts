/**
 * String utility functions
 */

/**
 * Removes all non-numeric characters from a string
 *
 * @param value - Input string
 * @returns String containing only numbers
 */
export function numbersOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Converts a string to uppercase
 *
 * @param value - Input string
 * @returns Uppercase string
 */
export function autoUppercase(value: string): string {
  return value.toUpperCase();
}
