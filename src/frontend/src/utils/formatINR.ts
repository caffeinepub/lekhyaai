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

  // Indian system: last 3 digits, then groups of 2 from right
  let formatted: string;
  if (intPart.length <= 3) {
    formatted = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    formatted = `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`;
  }

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
 * Convert a rupee amount (number) to Indian number system words.
 * e.g. 145000 → "One Lakh Forty Five Thousand Rupees Only"
 * e.g. 104160.50 → "One Lakh Four Thousand One Hundred Sixty Rupees and Fifty Paise Only"
 */
export function amountToWordsIN(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function wordify(n: number): string {
    if (n === 0) return "";
    if (n < 20) return `${ones[n]} `;
    if (n < 100)
      return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""} `;
    if (n < 1000)
      return `${ones[Math.floor(n / 100)]} Hundred ${wordify(n % 100)}`;
    if (n < 100000)
      return `${wordify(Math.floor(n / 1000))}Thousand ${wordify(n % 1000)}`;
    if (n < 10000000)
      return `${wordify(Math.floor(n / 100000))}Lakh ${wordify(n % 100000)}`;
    return `${wordify(Math.floor(n / 10000000))}Crore ${wordify(n % 10000000)}`;
  }

  if (amount <= 0) return "";
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = wordify(rupees).trim();
  if (!words) words = "Zero";
  words += " Rupees";

  if (paise > 0) {
    words += ` and ${wordify(paise).trim()} Paise`;
  }

  return `${words} Only`;
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
