/**
 * Hook for handling formatted number input with comma separators
 * Automatically formats numbers as user types (e.g., 1000 -> 1,000)
 * while maintaining the actual numeric value for submission
 */

export function formatNumberInput(value: string): string {
  // Remove any non-digit and non-decimal characters
  const cleaned = value.replace(/[^\d.]/g, '');
  
  if (!cleaned) return '';
  
  // Split into integer and decimal parts
  const parts = cleaned.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add commas to integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Reconstruct the number
  return decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;
}

/**
 * Remove formatting from a formatted number string
 * Used when submitting form data
 */
export function unformatNumberInput(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Format a number for display with comma separators
 * Used for showing formatted numbers in read-only contexts
 */
export function formatNumberForDisplay(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  return formatNumberInput(numValue.toString());
}
