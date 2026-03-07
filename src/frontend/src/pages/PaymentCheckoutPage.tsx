import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Shield,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { formatINRNumber } from "../utils/formatINR";
import { getPricingConfig } from "../utils/pricingConfig";
import { getSuperUserConfig } from "../utils/superuser";

type PaymentState = "form" | "processing" | "success" | "cancelled";

export default function PaymentCheckoutPage() {
  const pricing = getPricingConfig();
  const suConfig = getSuperUserConfig();
  const { actor, isFetching } = useActor();

  const isLiveMode = !!(
    suConfig.paymentGatewayKey && suConfig.paymentGatewayKey.length > 10
  );

  // Read plan from URL params or default to professional
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get("plan") as
    | "starter"
    | "professional"
    | "enterprise"
    | null;
  const billingParam = urlParams.get("billing") as "monthly" | "annual" | null;
  const successParam = urlParams.get("success");
  const cancelledParam = urlParams.get("cancelled");

  const [selectedPlan] = useState<"starter" | "professional" | "enterprise">(
    planParam ?? "professional",
  );
  const [billing] = useState<"monthly" | "annual">(billingParam ?? "monthly");

  const planAmount =
    billing === "annual"
      ? pricing[selectedPlan].annual
      : pricing[selectedPlan].monthly;

  const planLabels: Record<typeof selectedPlan, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  // Determine initial state from URL params
  function getInitialState(): PaymentState {
    if (successParam === "1") return "success";
    if (cancelledParam === "1") return "cancelled";
    return "form";
  }

  const [paymentState, setPaymentState] =
    useState<PaymentState>(getInitialState);
  const [receiptId] = useState(`LKY${Date.now().toString(36).toUpperCase()}`);

  async function handleProceedToCheckout() {
    if (!actor) {
      toast.error("Backend not ready. Please try again.");
      return;
    }
    setPaymentState("processing");
    try {
      const configured = await actor.isStripeConfigured();
      if (!configured) {
        toast.error("Payment gateway not configured. Please contact support.");
        setPaymentState("form");
        return;
      }

      const plan = planParam ?? "professional";
      const bill = billingParam ?? "monthly";
      const successUrl = `${window.location.origin}/app/payment-checkout?plan=${plan}&billing=${bill}&success=1`;
      const cancelUrl = `${window.location.origin}/app/payment-checkout?plan=${plan}&billing=${bill}&cancelled=1`;

      const session = await actor.createCheckoutSession(
        [
          {
            productName: `LekhyaAI ${planLabels[selectedPlan]} Plan`,
            productDescription: "AI-Powered GST Accounting",
            quantity: 1n,
            priceInCents: BigInt(planAmount * 100),
            currency: "INR",
          },
        ],
        successUrl,
        cancelUrl,
      );

      window.location.href = session;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setPaymentState("form");
    }
  }

  function handleTryAgain() {
    // Remove success/cancelled params from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("success");
    newUrl.searchParams.delete("cancelled");
    window.history.replaceState({}, "", newUrl.toString());
    setPaymentState("form");
  }

  const isProcessing = paymentState === "processing";
  const buttonDisabled = isProcessing || isFetching || !actor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-3">
            <span className="text-primary-foreground font-display text-xl font-bold">
              L
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            LekhyaAI
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Secure Checkout
          </p>
        </div>

        <AnimatePresence mode="wait">
          {paymentState === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 text-center space-y-4"
              data-ocid="payment.success_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your subscription is now active
                </p>
              </div>

              {/* Receipt */}
              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt ID</span>
                  <span className="font-mono font-medium">{receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {planLabels[selectedPlan]} ({billing})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-foreground">
                    ₹{formatINRNumber(planAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>
                    {new Date().toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <Button
                data-ocid="payment.go_to_dashboard.button"
                onClick={() => {
                  window.location.href = "/app";
                }}
                className="w-full bg-primary text-primary-foreground"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          ) : paymentState === "cancelled" ? (
            <motion.div
              key="cancelled"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 text-center space-y-4"
              data-ocid="payment.cancelled.error_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
              >
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Checkout Cancelled
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Payment was not completed.
                </p>
              </div>

              {/* Plan summary reminder */}
              <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {planLabels[selectedPlan]} ({billing})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">
                    ₹{formatINRNumber(planAmount)}
                  </span>
                </div>
              </div>

              <Button
                data-ocid="payment.try_again.button"
                onClick={handleTryAgain}
                className="w-full bg-primary text-primary-foreground"
              >
                Try Again
              </Button>

              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  window.location.href = "/app";
                }}
              >
                Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {/* Plan Summary */}
              <div className="bg-primary/5 border-b border-border p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Subscribing to
                  </p>
                  <p className="font-display text-xl font-bold text-foreground mt-0.5">
                    {planLabels[selectedPlan]} Plan
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {billing} billing
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-primary">
                    ₹{formatINRNumber(planAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {billing === "annual" ? "/ year" : "/ month"}
                  </p>
                  {/* TEST/LIVE badge */}
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLiveMode
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                    }`}
                    data-ocid="payment.mode.badge"
                  >
                    {isLiveMode ? "LIVE" : "TEST MODE"}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>You'll be redirected to Stripe's secure checkout</span>
                </div>

                {/* What you'll get */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Included in {planLabels[selectedPlan]} Plan
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      AI-Powered GST Accounting (GSTR-1, GSTR-3B)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      Unlimited Invoices, Customers & Products
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      LekhyaAI Engine — Intelligent Automation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      Multi-business Management & RBAC
                    </li>
                  </ul>
                </div>

                {/* Proceed Button */}
                <Button
                  data-ocid="payment.proceed_to_checkout.primary_button"
                  onClick={handleProceedToCheckout}
                  disabled={buttonDisabled}
                  className="w-full bg-primary text-primary-foreground text-base font-semibold h-11"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to Stripe…
                    </>
                  ) : isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Proceed to Secure Checkout
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {isLiveMode
                      ? "Live payment processing via Stripe"
                      : "Test mode — no real charges"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} LekhyaAI · Accounting ko banaye easy
        </p>
      </div>
    </div>
  );
}
