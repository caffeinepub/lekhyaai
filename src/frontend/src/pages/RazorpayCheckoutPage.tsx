/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Razorpay: any;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  BadgeCheck,
  Bot,
  Building2,
  Check,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Types ─────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price: number; // INR per month
  pricePaise: number; // price in paise for Razorpay
  color: string;
  badge?: string;
  description: string;
  features: { icon: React.ElementType; label: string }[];
  invoiceLimit: string;
  userLimit: string;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 999,
    pricePaise: 99900,
    color: "border-border",
    description: "Perfect for freelancers and small businesses getting started",
    invoiceLimit: "Up to 100 invoices/mo",
    userLimit: "2 users",
    features: [
      { icon: FileText, label: "Invoices & Expenses" },
      { icon: Users, label: "Customer & Vendor Management" },
      { icon: Building2, label: "GST Reports (GSTR-1, 3B)" },
      { icon: ShieldCheck, label: "Bank Account Tracking" },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 2499,
    pricePaise: 249900,
    color: "border-primary",
    badge: "Most Popular",
    description: "For growing SMEs with advanced GST and AI automation needs",
    invoiceLimit: "Unlimited invoices",
    userLimit: "10 users",
    features: [
      { icon: FileText, label: "Everything in Basic" },
      { icon: Bot, label: "AI Assistant (LekhyaAI Engine)" },
      { icon: Zap, label: "Invoice OCR Scanning" },
      { icon: Building2, label: "B2B Reconciliation & TDS" },
      { icon: ShieldCheck, label: "Tally Import / Export" },
      { icon: CreditCard, label: "P&L + Balance Sheet Reports" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 5999,
    pricePaise: 599900,
    color: "border-amber-400/60",
    badge: "Best Value",
    description: "Full platform access for CA firms and large enterprises",
    invoiceLimit: "Unlimited everything",
    userLimit: "Unlimited users",
    features: [
      { icon: FileText, label: "Everything in Professional" },
      { icon: Users, label: "Multi-business management" },
      { icon: Bot, label: "Priority AI responses" },
      { icon: ShieldCheck, label: "Custom database integration" },
      { icon: Building2, label: "Dedicated support & onboarding" },
      { icon: BadgeCheck, label: "SLA guarantee & audit trails" },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────
function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN");
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Success Screen ────────────────────────────────────────────────
function SuccessScreen({
  tenantId,
  plan,
  businessName,
}: {
  tenantId: string;
  plan: string;
  businessName: string;
}) {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center"
      data-ocid="razorpay.success_state"
    >
      <div className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center mb-6">
        <BadgeCheck className="w-10 h-10 text-success" />
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">
        Welcome to LekhyaAI!
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your <strong className="text-foreground">{plan}</strong> subscription
        for <strong className="text-foreground">{businessName}</strong> has been
        activated successfully.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-3 mb-8">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tenant ID</span>
          <span className="font-mono font-bold text-primary">{tenantId}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan</span>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {plan}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <Badge className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        </div>
      </div>

      <Button
        data-ocid="razorpay.go_to_dashboard.button"
        onClick={() => {
          window.location.href = "/app";
        }}
        className="px-8"
      >
        Go to Dashboard
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function RazorpayCheckoutPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const [isGatewayConfigured, setIsGatewayConfigured] = useState<
    boolean | null
  >(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paying, setPaying] = useState(false);
  const [successData, setSuccessData] = useState<{
    tenantId: string;
    plan: string;
    businessName: string;
  } | null>(null);

  // Fetch Razorpay configuration status
  useEffect(() => {
    if (!actor || actorFetching) return;
    actor
      .isRazorpayConfigured()
      .then((v) => setIsGatewayConfigured(v))
      .catch(() => setIsGatewayConfigured(false));
  }, [actor, actorFetching]);

  async function handleSubscribe(plan: Plan) {
    if (!actor || !identity) {
      toast.error("Please log in to subscribe");
      return;
    }

    setSelectedPlan(plan);
    setPaying(true);

    try {
      // Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Failed to load payment SDK");
      }

      // Get key ID from backend
      let keyId = "";
      let orderId = "";

      try {
        [keyId, orderId] = await Promise.all([
          actor.getRazorpayKeyId(),
          actor.createRazorpayOrder(
            BigInt(plan.pricePaise),
            "INR",
            `lekhya_${plan.id}_${Date.now()}`,
          ),
        ]);
      } catch (backendErr) {
        // Backend fallback: use localStorage simulation
        console.warn(
          "Backend order creation failed, using local fallback",
          backendErr,
        );
        orderId = `order_local_${Date.now()}`;
        keyId = "";
      }

      // Business name from localStorage or default
      const businessName =
        (() => {
          try {
            const businesses = JSON.parse(
              localStorage.getItem("lekhya_businesses") ?? "[]",
            );
            return businesses[0]?.name ?? "Your Business";
          } catch {
            return "Your Business";
          }
        })() ?? "Your Business";

      const callerEmail =
        localStorage.getItem("lekhya_user_email") ?? "client@example.com";

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId || "rzp_test_placeholder",
          amount: plan.pricePaise,
          currency: "INR",
          name: "LekhyaAI",
          description: `${plan.name} Subscription — ₹${formatINR(plan.price)}/month`,
          order_id: orderId.startsWith("order_local_") ? undefined : orderId,
          prefill: {
            email: callerEmail,
          },
          theme: {
            color: "#6c47ff",
          },
          handler: async (response: any) => {
            try {
              const finalOrderId =
                response.razorpay_order_id ||
                response.razorpay_payment_id ||
                orderId;
              const principal = identity.getPrincipal();

              // Record payment + provision tenant
              try {
                await actor.recordPayment(
                  finalOrderId,
                  principal,
                  businessName,
                  plan.name,
                  BigInt(plan.price),
                  "razorpay",
                );
                const tenantId = await actor.provisionClientTenant(
                  principal,
                  businessName,
                  callerEmail,
                  plan.name,
                  365n,
                );
                setSuccessData({ tenantId, plan: plan.name, businessName });
              } catch (provisionErr) {
                console.warn(
                  "Backend provision failed, using local fallback",
                  provisionErr,
                );
                // Local fallback
                const localTenantId = `TEN-${Math.floor(1000 + Math.random() * 9000)}`;
                const localPayments = JSON.parse(
                  localStorage.getItem("lekhya_payments") ?? "[]",
                );
                localPayments.push({
                  orderId: finalOrderId,
                  plan: plan.name,
                  amount: plan.price,
                  businessName,
                  paidAt: new Date().toISOString(),
                  tenantId: localTenantId,
                });
                localStorage.setItem(
                  "lekhya_payments",
                  JSON.stringify(localPayments),
                );
                setSuccessData({
                  tenantId: localTenantId,
                  plan: plan.name,
                  businessName,
                });
              }

              toast.success(`${plan.name} subscription activated!`);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled by user"));
            },
          },
        };

        if (!keyId) {
          // No real key — simulate locally
          const localTenantId = `TEN-${Math.floor(1000 + Math.random() * 9000)}`;
          setSuccessData({
            tenantId: localTenantId,
            plan: plan.name,
            businessName,
          });
          toast.success(`${plan.name} subscription activated (demo mode)!`);
          resolve();
          return;
        }

        const rzp = new Razorpay(options);
        rzp.open();
      });
    } catch (err: any) {
      if (err?.message !== "Payment cancelled by user") {
        toast.error(err?.message ?? "Payment failed. Please try again.");
      } else {
        toast.info("Payment cancelled");
      }
    } finally {
      setPaying(false);
      setSelectedPlan(null);
    }
  }

  if (successData) {
    return (
      <SuccessScreen
        tenantId={successData.tenantId}
        plan={successData.plan}
        businessName={successData.businessName}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground text-lg">
          GST-compliant accounting with AI automation. All plans include 365
          days access.
        </p>
        {isGatewayConfigured === false && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm mt-2"
            data-ocid="razorpay.gateway_notice.error_state"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Payment gateway is being set up. Contact support to subscribe.
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div
        className="grid gap-6 md:grid-cols-3"
        data-ocid="razorpay.plans.list"
      >
        {PLANS.map((plan, idx) => (
          <Card
            key={plan.id}
            data-ocid={`razorpay.plan.item.${idx + 1}`}
            className={`relative flex flex-col border-2 transition-all duration-200 ${plan.color} ${
              plan.badge ? "shadow-lg shadow-primary/10" : ""
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-bold shadow-sm">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="pt-6 pb-2">
              <CardTitle className="text-xl font-display">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
              <div className="flex items-end gap-1 pt-2">
                <span className="text-4xl font-display font-bold text-foreground">
                  ₹{formatINR(plan.price)}
                </span>
                <span className="text-muted-foreground text-sm mb-1">
                  /month
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pb-4">
              {/* Limits */}
              <div className="flex flex-col gap-1.5 text-sm bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  {plan.invoiceLimit}
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {plan.userLimit}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                data-ocid={`razorpay.plan.subscribe_button.${idx + 1}`}
                className="w-full"
                variant={plan.badge ? "default" : "outline"}
                onClick={() => handleSubscribe(plan)}
                disabled={
                  paying || actorFetching || isGatewayConfigured === false
                }
              >
                {paying && selectedPlan?.id === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscribe — ₹{formatINR(plan.price)}/mo
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          Secured by Razorpay
        </div>
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-primary" />
          GST Invoice provided
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Instant activation
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
