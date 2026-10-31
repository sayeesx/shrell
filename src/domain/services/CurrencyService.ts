/**
 * Currency Service for Indian Rupee (INR) handling using integer Paisa (1 INR = 100 Paisa).
 * Eliminates floating point rounding errors in financial computations.
 */

export function paisaToRupees(paisa: number): number {
  return Math.round(paisa) / 100;
}

export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Formats integer paisa into standard Indian Number System grouping (lakhs, crores).
 * Example: 1499900 paisa -> "₹14,999" (or "₹14,999.00" if includeDecimals is true)
 */
export function formatINR(paisa: number, includeDecimals = false): string {
  if (isNaN(paisa) || paisa === null || paisa === undefined) {
    return '₹0';
  }

  const rupees = paisaToRupees(paisa);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  return formatter.format(rupees);
}

/**
 * Calculates GST component from inclusive or exclusive price.
 * Standard Indian ecommerce items display prices inclusive of GST.
 */
export function calculateTaxInclusive(totalPaisa: number, gstRatePercent = 18): {
  baseAmountPaisa: number;
  taxAmountPaisa: number;
} {
  const base = Math.round((totalPaisa * 100) / (100 + gstRatePercent));
  const tax = totalPaisa - base;
  return {
    baseAmountPaisa: base,
    taxAmountPaisa: tax,
  };
}
