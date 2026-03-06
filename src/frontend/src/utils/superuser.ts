/**
 * SuperUser / Developer mode utilities
 * The developer PIN is stored hashed in localStorage.
 * Default PIN: LEKHYA2024
 */

const LS_SUPERUSER_ACTIVE = "lekhya_superuser_active";
const LS_SUPERUSER_PIN_HASH = "lekhya_superuser_pin_hash";
const DEFAULT_PIN = "LEKHYA2024";

/** Very lightweight hash for PIN storage (not crypto-grade, just obfuscation) */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getStoredPinHash(): string {
  return localStorage.getItem(LS_SUPERUSER_PIN_HASH) ?? simpleHash(DEFAULT_PIN);
}

export function isSuperUserActive(): boolean {
  return localStorage.getItem(LS_SUPERUSER_ACTIVE) === "1";
}

export function verifySuperUserPin(pin: string): boolean {
  return simpleHash(pin.trim()) === getStoredPinHash();
}

export function activateSuperUser(pin: string): boolean {
  if (verifySuperUserPin(pin)) {
    localStorage.setItem(LS_SUPERUSER_ACTIVE, "1");
    return true;
  }
  return false;
}

export function deactivateSuperUser(): void {
  localStorage.removeItem(LS_SUPERUSER_ACTIVE);
}

export function changeSuperUserPin(oldPin: string, newPin: string): boolean {
  if (!verifySuperUserPin(oldPin)) return false;
  if (!newPin || newPin.trim().length < 6) return false;
  localStorage.setItem(LS_SUPERUSER_PIN_HASH, simpleHash(newPin.trim()));
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
