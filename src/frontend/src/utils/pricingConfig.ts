/**
 * Editable pricing configuration for LekhyaAI SaaS plans.
 * SuperUser can edit these in SuperUser Settings.
 * These prices are used on the marketing website and quotation form.
 */

export interface PricingConfig {
  starter: { monthly: number; annual: number };
  professional: { monthly: number; annual: number };
  enterprise: { monthly: number; annual: number };
  perUser: number; // per additional user/month
  perInvoice: number; // per invoice above plan limit
  tallyImport: {
    records100: number;
    records500: number;
    recordsUnlimited: number;
  };
  devChargesOneTime: number;
  serverMonthly: number;
  gstRate: number; // default 18
}

const DEFAULT_PRICING: PricingConfig = {
  starter: { monthly: 499, annual: 4990 },
  professional: { monthly: 999, annual: 9990 },
  enterprise: { monthly: 2499, annual: 24990 },
  perUser: 199,
  perInvoice: 2,
  tallyImport: {
    records100: 999,
    records500: 2999,
    recordsUnlimited: 4999,
  },
  devChargesOneTime: 15000,
  serverMonthly: 999,
  gstRate: 18,
};

const LS_KEY = "lekhya_pricing_config";

export function getPricingConfig(): PricingConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      return { ...DEFAULT_PRICING, ...JSON.parse(raw) } as PricingConfig;
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PRICING };
}

export function savePricingConfig(config: PricingConfig): void {
  localStorage.setItem(LS_KEY, JSON.stringify(config));
}
