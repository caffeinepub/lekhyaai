import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Crown,
  FileText,
  Loader2,
  Package,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useSubscriptionStatus } from "../hooks/useQueries";
import { formatINRNumber } from "../utils/formatINR";

// SubscriptionTier is not yet in backend.d.ts — define locally
const SubscriptionTier = { free: "free", paid: "paid" } as const;

const FREE_LIMITS = {
  invoices: 10,
  customers: 5,
  products: 5,
};

const PRO_FEATURES = [
  "Unlimited invoices, customers & products",
  "Advanced GST Reports (GSTR-1, GSTR-3B format)",
  "AI Accountant with full business context",
  "Multi-business management",
  "Priority support",
  "Bulk import/export",
  "E-Invoice IRN generation",
  "E-Way Bill integration",
];

export default function SubscriptionPage() {
  const { data: sub, isLoading } = useSubscriptionStatus();
  const { actor } = useActor();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const isPro = sub?.tier === SubscriptionTier.paid;

  // Handle Stripe return URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      toast.success("Subscription activated! You now have full access.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (params.get("cancelled") === "1") {
      toast.info("Checkout was cancelled.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("cancelled");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  async function handleUpgrade() {
    if (!actor) return;
    setUpgradeLoading(true);
    try {
      const isConfigured = await actor.isStripeConfigured();
      if (!isConfigured) {
        toast.error("Payment gateway not configured. Please contact support.");
        return;
      }
      const session = await actor.createCheckoutSession(
        [
          {
            productName: "LekhyaAI Pro",
            productDescription: "AI-Powered GST Accounting — Full Access",
            quantity: 1n,
            priceInCents: 99900n, // ₹999 = 99900 paise
            currency: "INR",
          },
        ],
        `${window.location.origin}/subscription?success=1`,
        `${window.location.origin}/subscription?cancelled=1`,
      );
      window.location.href = session;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl text-foreground">
          Subscription
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your LekhyaAI plan
        </p>
      </div>

      {/* Current Plan */}
      <div
        className={`rounded-2xl border-2 p-6 mb-6 ${isPro ? "border-accent bg-accent/5" : "border-border bg-card"} shadow-card`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? "bg-accent" : "bg-muted"}`}
            >
              {isPro ? (
                <Crown className="w-5 h-5 text-accent-foreground" />
              ) : (
                <Zap className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {isPro ? "LekhyaAI Pro" : "Free Plan"}
              </p>
              <p className="text-muted-foreground text-sm">
                {isPro ? "Full access · ₹ 999/month" : "Limited features"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {isPro ? "ACTIVE" : "FREE"}
          </span>
        </div>

        {/* Usage stats for free tier */}
        {!isPro && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">
              Usage this month
            </p>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-8 w-full" />
                ))}
              </div>
            ) : sub ? (
              [
                {
                  label: "Invoices",
                  icon: FileText,
                  used: Number(sub.invoiceCount),
                  limit: FREE_LIMITS.invoices,
                },
                {
                  label: "Customers",
                  icon: Users,
                  used: Number(sub.customerCount),
                  limit: FREE_LIMITS.customers,
                },
                {
                  label: "Products",
                  icon: Package,
                  used: Number(sub.productCount),
                  limit: FREE_LIMITS.products,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  data-ocid={`subscription.${item.label.toLowerCase()}_usage`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${item.used >= item.limit ? "text-destructive" : "text-foreground"}`}
                    >
                      {item.used}/{item.limit}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (item.used / item.limit) * 100)}
                    className={`h-2 ${item.used >= item.limit ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
                  />
                  {item.used >= item.limit && (
                    <p className="text-xs text-destructive mt-1">
                      Limit reached — upgrade to add more
                    </p>
                  )}
                </div>
              ))
            ) : null}
          </div>
        )}

        {isPro && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Invoices",
                value: sub?.invoiceCount?.toString() ?? "∞",
              },
              {
                label: "Customers",
                value: sub?.customerCount?.toString() ?? "∞",
              },
              {
                label: "Products",
                value: sub?.productCount?.toString() ?? "∞",
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade card */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-card"
          data-ocid="subscription.upgrade_card"
        >
          {/* Decorative */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, oklch(0.72 0.16 80 / 0.8) 0%, transparent 50%)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Crown
                className="w-5 h-5"
                style={{ color: "oklch(0.65 0.18 55)" }}
              />
              <span className="font-bold text-foreground text-lg">
                Upgrade to Pro
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Unlock unlimited invoices, advanced GST reports, and full AI
              accounting for your business.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>

            {/* Pricing toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-end gap-1 bg-muted/60 rounded-xl px-4 py-3 border border-border">
                  <span className="text-3xl font-bold text-foreground">
                    ₹{formatINRNumber(999)}
                  </span>
                  <span className="text-muted-foreground text-sm pb-0.5">
                    /month
                  </span>
                </div>
                <div className="flex items-end gap-1 bg-success/10 rounded-xl px-4 py-3 border border-success/20">
                  <span className="text-2xl font-bold text-foreground">
                    ₹{formatINRNumber(9999)}
                  </span>
                  <span className="text-muted-foreground text-sm pb-0.5">
                    /year
                  </span>
                  <span className="text-xs font-bold text-success pb-0.5 ml-1">
                    Save ~17%
                  </span>
                </div>
              </div>
            </div>

            <Button
              data-ocid="subscription.upgrade_button"
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </>
              )}
            </Button>

            <p className="text-muted-foreground text-xs mt-3">
              Secured checkout via Stripe. Cancel anytime.
            </p>
          </div>
        </motion.div>
      )}

      {isPro && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
          <Crown
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "oklch(0.55 0.18 155)" }}
          />
          <p className="font-semibold text-foreground">You're on Pro!</p>
          <p className="text-muted-foreground text-sm mt-1">
            Enjoy unlimited access to all LekhyaAI features.
          </p>
        </div>
      )}
    </div>
  );
}
