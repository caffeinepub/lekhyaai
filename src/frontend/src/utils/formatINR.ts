/**
 * Format a bigint paise value to Indian Rupee string.
 * Amounts are stored in paise (1/100 rupee).
 * Uses Indian lakh/crore number system.
 *
 * @example
 * formatINR(12500000n) // → "₹ 1,25,000.00"
 * formatINR(100000n) // → "₹ 1,000.00"
 */
export function formatINR(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return formatINRNumber(rupees);
}

export function formatINRNumber(rupees: number): string {
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);

  const [intPart, decPart = "00"] = absRupees.toFixed(2).split(".");

  // Indian number formatting: last 3 digits, then groups of 2
  const formatted = intPart.replace(/\B(?=(\d{2})+(?!\d)(?<=\d{3,}))/g, ",");

  return `${isNegative ? "-" : ""}₹\u00A0${formatted}.${decPart}`;
}

/**
 * Parse INR string to paise bigint
 */
export function parseINRToPaise(value: string): bigint {
  const cleaned = value.replace(/[₹,\s]/g, "");
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num)) return 0n;
  return BigInt(Math.round(num * 100));
}

/**
 * Format time (nanoseconds bigint) to date string
 */
export function formatDate(timeNs: bigint): string {
  const ms = Number(timeNs / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateInput(timeNs: bigint): string {
  const ms = Number(timeNs / 1_000_000n);
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function dateStringToNs(dateStr: string): bigint {
  const ms = new Date(dateStr).getTime();
  return BigInt(ms) * 1_000_000n;
}

/**
 * Current Indian Financial Year label
 * FY runs April to March
 */
export function currentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  if (month >= 4) {
    return `FY ${year}-${String(year + 1).slice(2)}`;
  }
  return `FY ${year - 1}-${String(year).slice(2)}`;
}
