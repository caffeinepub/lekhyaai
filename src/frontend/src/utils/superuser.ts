/**
 * SuperUser / Developer mode utilities
 * The developer PIN is stored as a SHA-256 hash in localStorage.
 * Default PIN: LEKHYA2024
 */

const LS_SUPERUSER_ACTIVE = "lekhya_superuser_active";
const LS_SUPERUSER_PIN_HASH = "lekhya_superuser_pin_hash";
const DEFAULT_PIN = "LEKHYA2024";

/** Secure SHA-256 hash using Web Crypto API */
async function sha256Hash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getStoredPinHash(): Promise<string> {
  const stored = localStorage.getItem(LS_SUPERUSER_PIN_HASH);
  if (stored) return stored;
  // First time: hash the default PIN and store it
  const defaultHash = await sha256Hash(DEFAULT_PIN);
  localStorage.setItem(LS_SUPERUSER_PIN_HASH, defaultHash);
  return defaultHash;
}

export function isSuperUserActive(): boolean {
  return localStorage.getItem(LS_SUPERUSER_ACTIVE) === "1";
}

export async function verifySuperUserPin(pin: string): Promise<boolean> {
  const hashed = await sha256Hash(pin);
  const stored = await getStoredPinHash();
  return hashed === stored;
}

export async function activateSuperUser(pin: string): Promise<boolean> {
  const ok = await verifySuperUserPin(pin);
  if (ok) {
    localStorage.setItem(LS_SUPERUSER_ACTIVE, "1");
  }
  return ok;
}

export function deactivateSuperUser(): void {
  localStorage.removeItem(LS_SUPERUSER_ACTIVE);
}

export async function changeSuperUserPin(
  oldPin: string,
  newPin: string,
): Promise<boolean> {
  const valid = await verifySuperUserPin(oldPin);
  if (!valid) return false;
  if (!newPin || newPin.trim().length < 6) return false;
  const newHash = await sha256Hash(newPin.trim());
  localStorage.setItem(LS_SUPERUSER_PIN_HASH, newHash);
  return true;
}

// ─── SuperUser API Keys ─────────────────────────────────────────────

export interface SuperUserConfig {
  groqApiKey: string;
  groqModel: string;
  llamaVisionModel: string;
  whatsappApiKey: string;
  whatsappPhoneId: string;
  emailSmtpHost: string;
  emailSmtpPort: string;
  emailSmtpUser: string;
  emailSmtpPass: string;
  paymentGatewayKey: string;
  paymentGatewaySecret: string;
  gcpApiKey: string;
  autoBackupEnabled: boolean;
  autoBackupFrequency: "daily" | "weekly" | "monthly";
  backupDestination: string;
  developerNotes: string;
  dbConnectionString: string;
  dbApiKey: string;
  dbWebhookUrl: string;
  dbWebhookSecret: string;
  dbSyncOnInvoice: boolean;
  dbSyncOnExpense: boolean;
  dbSyncOnPayment: boolean;
}

const LS_SUPERUSER_CONFIG = "lekhya_superuser_config";

const DEFAULT_CONFIG: SuperUserConfig = {
  groqApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  llamaVisionModel: "meta-llama/llama-4-scout-17b-16e-instruct",
  whatsappApiKey: "",
  whatsappPhoneId: "",
  emailSmtpHost: "",
  emailSmtpPort: "587",
  emailSmtpUser: "",
  emailSmtpPass: "",
  paymentGatewayKey: "",
  paymentGatewaySecret: "",
  gcpApiKey: "",
  autoBackupEnabled: false,
  autoBackupFrequency: "daily",
  backupDestination: "",
  developerNotes: "",
  dbConnectionString: "",
  dbApiKey: "",
  dbWebhookUrl: "",
  dbWebhookSecret: "",
  dbSyncOnInvoice: false,
  dbSyncOnExpense: false,
  dbSyncOnPayment: false,
};

export function getSuperUserConfig(): SuperUserConfig {
  try {
    const raw = localStorage.getItem(LS_SUPERUSER_CONFIG);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export function saveSuperUserConfig(config: Partial<SuperUserConfig>): void {
  const current = getSuperUserConfig();
  localStorage.setItem(
    LS_SUPERUSER_CONFIG,
    JSON.stringify({ ...current, ...config }),
  );
}
