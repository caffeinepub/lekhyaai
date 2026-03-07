import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FileDown, Printer, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { formatINRNumber } from "../utils/formatINR";
import { getPricingConfig } from "../utils/pricingConfig";
import { isSuperUserActive } from "../utils/superuser";

const ADDONS = [
  {
    id: "ocr",
    label: "OCR Invoice Scanner (Llama Vision)",
    defaultIncluded: true,
  },
  { id: "ai", label: "AI-Powered Accounting Assistant", defaultIncluded: true },
  { id: "tally", label: "Tally ERP Import Module", defaultIncluded: false },
  {
    id: "whatsapp",
    label: "WhatsApp Business Integration",
    defaultIncluded: false,
  },
  { id: "email", label: "Email / SMTP Integration", defaultIncluded: false },
  { id: "b2b", label: "B2B Invoice Reconciliation", defaultIncluded: false },
  { id: "multi", label: "Multi-Business Support", defaultIncluded: true },
  {
    id: "branding",
    label: "Custom Branding & White-label",
    defaultIncluded: false,
  },
];

type TallyTier = "none" | "100" | "500" | "unlimited";

export default function QuotationPage() {
  const isSuperUser = isSuperUserActive();
  const pricing = getPricingConfig();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    clientName: "",
    clientGstin: "",
    date: today,
    users: 1,
    monthlyInvoices: 100,
    tallyTier: "none" as TallyTier,
    devCharges: pricing.devChargesOneTime,
    serverCharges: pricing.serverMonthly,
    loyaltyDiscount: 0,
    contractMonths: 12,
    plan: "professional" as "starter" | "professional" | "enterprise",
  });

  const [selectedAddons, setSelectedAddons] = useState<string[]>(
    ADDONS.filter((a) => a.defaultIncluded).map((a) => a.id),
  );

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toggleAddon(id: string) {
    setSelectedAddons((p) =>
      p.includes(id) ? p.filter((a) => a !== id) : [...p, id],
    );
  }

  // Compute pricing breakdown
  const planMonthly = pricing[form.plan].monthly;
  const extraUsers = Math.max(0, form.users - 1);
  const extraUsersCost = extraUsers * pricing.perUser;

  const tallyAddonCost =
    form.tallyTier === "100"
      ? pricing.tallyImport.records100
      : form.tallyTier === "500"
        ? pricing.tallyImport.records500
        : form.tallyTier === "unlimited"
          ? pricing.tallyImport.recordsUnlimited
          : 0;

  const whatsappMonthly = selectedAddons.includes("whatsapp") ? 299 : 0;
  const emailMonthly = selectedAddons.includes("email") ? 149 : 0;
  const brandingOneTime = selectedAddons.includes("branding") ? 5000 : 0;

  const recurringSubtotal =
    planMonthly + extraUsersCost + whatsappMonthly + emailMonthly;

  const monthlyRecurring = recurringSubtotal;
  const discountAmount = Math.round(
    (monthlyRecurring * form.loyaltyDiscount) / 100,
  );
  const monthlyAfterDiscount = monthlyRecurring - discountAmount;
  const monthlyGst = Math.round((monthlyAfterDiscount * pricing.gstRate) / 100);
  const monthlyTotal = monthlyAfterDiscount + monthlyGst;
  const contractTotal = monthlyTotal * form.contractMonths;

  const oneTimeSubtotal =
    form.devCharges +
    (tallyAddonCost > 0 ? tallyAddonCost : 0) +
    brandingOneTime;
  const oneTimeGst = Math.round((oneTimeSubtotal * pricing.gstRate) / 100);
  const oneTimeTotal = oneTimeSubtotal + oneTimeGst;

  const grandTotal = contractTotal + oneTimeTotal;

  const planLabel = form.plan.charAt(0).toUpperCase() + form.plan.slice(1);

  function handlePrint() {
    if (!printRef.current) return;
    const _html = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LekhyaAI Quotation — ${form.clientName || "Client"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
            h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
            h2 { font-size: 16px; font-weight: 600; margin-bottom: 8px; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
            td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .total-row td { background: #f9fafb; font-weight: bold; border-top: 2px solid #e5e7eb; }
            .grand-total-row td { background: #1d4ed8; color: #fff; font-weight: bold; font-size: 14px; }
            .meta { display: flex; gap: 40px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
            .meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
            .meta-item value { font-size: 14px; font-weight: 600; display: block; margin-top: 2px; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <h1>LekhyaAI — Deployment Quotation</h1>
          <div class="meta">
            <div class="meta-item"><label>Client</label><value>${form.clientName || "—"}</value></div>
            <div class="meta-item"><label>GSTIN</label><value>${form.clientGstin || "—"}</value></div>
            <div class="meta-item"><label>Date</label><value>${form.date}</value></div>
            <div class="meta-item"><label>Plan</label><value>${planLabel}</value></div>
          </div>
          <h2>Monthly Recurring Charges</h2>
          <table>
            <thead><tr><th>Description</th><th class="text-right">Amount (₹)</th></tr></thead>
            <tbody>
              <tr><td>${planLabel} Plan</td><td class="text-right">${formatINRNumber(planMonthly)}</td></tr>
              ${extraUsers > 0 ? `<tr><td>Additional Users (${extraUsers} × ₹${pricing.perUser})</td><td class="text-right">${formatINRNumber(extraUsersCost)}</td></tr>` : ""}
              ${whatsappMonthly > 0 ? `<tr><td>WhatsApp Integration</td><td class="text-right">${formatINRNumber(whatsappMonthly)}</td></tr>` : ""}
              ${emailMonthly > 0 ? `<tr><td>Email Integration</td><td class="text-right">${formatINRNumber(emailMonthly)}</td></tr>` : ""}
              ${form.loyaltyDiscount > 0 ? `<tr><td>Loyalty Discount (${form.loyaltyDiscount}%)</td><td class="text-right">-${formatINRNumber(discountAmount)}</td></tr>` : ""}
              <tr><td>GST (${pricing.gstRate}%)</td><td class="text-right">${formatINRNumber(monthlyGst)}</td></tr>
              <tr class="total-row"><td>Monthly Total</td><td class="text-right">₹ ${formatINRNumber(monthlyTotal)}</td></tr>
              <tr class="total-row"><td>Contract Total (${form.contractMonths} months)</td><td class="text-right">₹ ${formatINRNumber(contractTotal)}</td></tr>
            </tbody>
          </table>
          <h2>One-Time Charges</h2>
          <table>
            <thead><tr><th>Description</th><th class="text-right">Amount (₹)</th></tr></thead>
            <tbody>
              <tr><td>Development & Setup Charges</td><td class="text-right">${formatINRNumber(form.devCharges)}</td></tr>
              <tr><td>Server (1 month)</td><td class="text-right">${formatINRNumber(form.serverCharges)}</td></tr>
              ${tallyAddonCost > 0 ? `<tr><td>Tally Import (${form.tallyTier} records)</td><td class="text-right">${formatINRNumber(tallyAddonCost)}</td></tr>` : ""}
              ${brandingOneTime > 0 ? `<tr><td>Custom Branding & White-label</td><td class="text-right">${formatINRNumber(brandingOneTime)}</td></tr>` : ""}
              <tr><td>GST (${pricing.gstRate}%)</td><td class="text-right">${formatINRNumber(oneTimeGst)}</td></tr>
              <tr class="total-row"><td>One-Time Total</td><td class="text-right">₹ ${formatINRNumber(oneTimeTotal)}</td></tr>
            </tbody>
          </table>
          <table style="margin-top:8px">
            <tbody>
              <tr class="grand-total-row"><td>GRAND TOTAL (${form.contractMonths} months)</td><td class="text-right">₹ ${formatINRNumber(grandTotal)}</td></tr>
            </tbody>
          </table>
          <div class="footer">Powered by LekhyaAI · Accounting ko banaye easy · Made in India 🇮🇳</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  if (!isSuperUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Shield className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="font-display text-xl text-foreground">
          SuperUser Access Required
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          The Quotation form is only accessible in Developer Mode.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2"
          >
            <FileDown className="w-7 h-7 text-primary/80" />
            Generate Quotation
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create a detailed deployment quote for a client
          </p>
        </div>
        <Button
          data-ocid="quotation.print.button"
          onClick={handlePrint}
          className="gap-2 bg-primary text-primary-foreground"
        >
          <Printer className="w-4 h-4" />
          Print / PDF
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* Client Info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Client Details</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input
                  data-ocid="quotation.client_name.input"
                  value={form.clientName}
                  onChange={(e) => setField("clientName", e.target.value)}
                  placeholder="Client / Company Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>GSTIN</Label>
                  <Input
                    data-ocid="quotation.client_gstin.input"
                    value={form.clientGstin}
                    onChange={(e) =>
                      setField("clientGstin", e.target.value.toUpperCase())
                    }
                    placeholder="GSTIN"
                    className="font-mono text-xs"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    data-ocid="quotation.date.input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plan & Usage */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Plan & Usage</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={form.plan}
                  onValueChange={(v) =>
                    setField(
                      "plan",
                      v as "starter" | "professional" | "enterprise",
                    )
                  }
                >
                  <SelectTrigger data-ocid="quotation.plan.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">
                      Starter — ₹{formatINRNumber(pricing.starter.monthly)}/mo
                    </SelectItem>
                    <SelectItem value="professional">
                      Professional — ₹
                      {formatINRNumber(pricing.professional.monthly)}/mo
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise — ₹
                      {formatINRNumber(pricing.enterprise.monthly)}/mo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Number of Users</Label>
                  <Input
                    data-ocid="quotation.users.input"
                    type="number"
                    min={1}
                    value={form.users}
                    onChange={(e) =>
                      setField("users", Number(e.target.value) || 1)
                    }
                  />
                  {extraUsers > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +₹{formatINRNumber(extraUsersCost)}/mo for {extraUsers}{" "}
                      extra user(s)
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Contract Duration (months)</Label>
                  <Input
                    data-ocid="quotation.contract_months.input"
                    type="number"
                    min={1}
                    value={form.contractMonths}
                    onChange={(e) =>
                      setField("contractMonths", Number(e.target.value) || 12)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tally Import Volume</Label>
                <Select
                  value={form.tallyTier}
                  onValueChange={(v) => setField("tallyTier", v as TallyTier)}
                >
                  <SelectTrigger data-ocid="quotation.tally_tier.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="100">
                      100 Records — ₹
                      {formatINRNumber(pricing.tallyImport.records100)}
                    </SelectItem>
                    <SelectItem value="500">
                      500 Records — ₹
                      {formatINRNumber(pricing.tallyImport.records500)}
                    </SelectItem>
                    <SelectItem value="unlimited">
                      Unlimited — ₹
                      {formatINRNumber(pricing.tallyImport.recordsUnlimited)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Feature Addons */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Feature Addons</h3>
            <div className="grid grid-cols-2 gap-2">
              {ADDONS.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-left w-full",
                    selectedAddons.includes(addon.id)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    data-ocid={`quotation.addon_${addon.id}.checkbox`}
                    checked={selectedAddons.includes(addon.id)}
                    onCheckedChange={() => toggleAddon(addon.id)}
                  />
                  <span className="text-xs leading-tight">{addon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Charges */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-foreground">
              Charges & Discount
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Development Charges (₹)</Label>
                <Input
                  data-ocid="quotation.dev_charges.input"
                  type="number"
                  min={0}
                  value={form.devCharges}
                  onChange={(e) =>
                    setField("devCharges", Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Server Charges/mo (₹)</Label>
                <Input
                  data-ocid="quotation.server_charges.input"
                  type="number"
                  min={0}
                  value={form.serverCharges}
                  onChange={(e) =>
                    setField("serverCharges", Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Loyalty Discount (%)</Label>
              <Input
                data-ocid="quotation.discount.input"
                type="number"
                min={0}
                max={50}
                value={form.loyaltyDiscount}
                onChange={(e) =>
                  setField(
                    "loyaltyDiscount",
                    Math.min(50, Number(e.target.value) || 0),
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div ref={printRef}>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 sticky top-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Quotation Preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  {form.clientName || "Client Name"} · {form.date || "Date"}
                </p>
              </div>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {planLabel}
              </span>
            </div>

            <Separator />

            {/* Monthly Recurring */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Monthly Recurring
              </p>
              <div className="space-y-1.5 text-sm">
                <LineItem label={`${planLabel} Plan`} amount={planMonthly} />
                {extraUsers > 0 && (
                  <LineItem
                    label={`${extraUsers} Extra User(s) × ₹${pricing.perUser}`}
                    amount={extraUsersCost}
                  />
                )}
                {whatsappMonthly > 0 && (
                  <LineItem
                    label="WhatsApp Integration"
                    amount={whatsappMonthly}
                  />
                )}
                {emailMonthly > 0 && (
                  <LineItem label="Email Integration" amount={emailMonthly} />
                )}
                {form.loyaltyDiscount > 0 && (
                  <LineItem
                    label={`Loyalty Discount (${form.loyaltyDiscount}%)`}
                    amount={-discountAmount}
                    className="text-success"
                  />
                )}
                <LineItem
                  label={`GST (${pricing.gstRate}%)`}
                  amount={monthlyGst}
                  className="text-muted-foreground"
                />
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between font-semibold">
                <span className="text-sm">Monthly Total</span>
                <span className="text-sm text-primary">
                  ₹{formatINRNumber(monthlyTotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Contract Total ({form.contractMonths} months)</span>
                <span className="font-medium">
                  ₹{formatINRNumber(contractTotal)}
                </span>
              </div>
            </div>

            <Separator />

            {/* One-Time */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                One-Time Charges
              </p>
              <div className="space-y-1.5 text-sm">
                <LineItem
                  label="Development & Setup"
                  amount={form.devCharges}
                />
                <LineItem
                  label="Server (1 month)"
                  amount={form.serverCharges}
                />
                {tallyAddonCost > 0 && (
                  <LineItem
                    label={`Tally Import (${form.tallyTier} records)`}
                    amount={tallyAddonCost}
                  />
                )}
                {brandingOneTime > 0 && (
                  <LineItem label="Custom Branding" amount={brandingOneTime} />
                )}
                <LineItem
                  label={`GST (${pricing.gstRate}%)`}
                  amount={oneTimeGst}
                  className="text-muted-foreground"
                />
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between font-semibold">
                <span className="text-sm">One-Time Total</span>
                <span className="text-sm">
                  ₹{formatINRNumber(oneTimeTotal)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Grand Total */}
            <div className="bg-primary rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-primary-foreground/70 text-xs">
                  Grand Total ({form.contractMonths}-month contract)
                </p>
                <p className="text-primary-foreground font-display text-2xl font-bold mt-0.5">
                  ₹{formatINRNumber(grandTotal)}
                </p>
              </div>
              <div className="text-primary-foreground/70 text-xs text-right">
                <p>Incl. GST @ {pricing.gstRate}%</p>
                {form.loyaltyDiscount > 0 && (
                  <p className="text-primary-foreground text-xs mt-1">
                    {form.loyaltyDiscount}% discount applied
                  </p>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Powered by LekhyaAI · Made in India 🇮🇳
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function LineItem({
  label,
  amount,
  className,
}: {
  label: string;
  amount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium tabular-nums text-xs">
        {amount < 0 ? "-" : ""}₹{formatINRNumber(Math.abs(amount))}
      </span>
    </div>
  );
}
