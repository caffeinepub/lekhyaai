import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, CreditCard, Loader2, Lock, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { formatINRNumber } from "../utils/formatINR";
import { getPricingConfig } from "../utils/pricingConfig";
import { getSuperUserConfig } from "../utils/superuser";

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

type PaymentState = "form" | "processing" | "success";

export default function PaymentCheckoutPage() {
  const pricing = getPricingConfig();
  const suConfig = getSuperUserConfig();
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

  const [paymentState, setPaymentState] = useState<PaymentState>("form");
  const [form, setForm] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptId] = useState(`LKY${Date.now().toString(36).toUpperCase()}`);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    const rawCard = form.cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16) errs.cardNumber = "Enter 16-digit card number";
    if (!form.expiry || form.expiry.length < 5)
      errs.expiry = "Enter valid expiry (MM/YY)";
    if (!form.cvv || form.cvv.length < 3) errs.cvv = "Enter 3-digit CVV";
    return errs;
  }

  async function handlePay() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setPaymentState("processing");
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    setPaymentState("success");
    toast.success("Payment processed successfully!");
  }

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

              {/* Payment Form */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secured by 256-bit encryption</span>
                </div>

                {/* Name on Card */}
                <div className="space-y-1.5">
                  <Label>Name on Card</Label>
                  <Input
                    data-ocid="payment.name.input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Full name as on card"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="payment.name.error_state"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <Label>Card Number</Label>
                  <div className="relative">
                    <Input
                      data-ocid="payment.card_number.input"
                      value={form.cardNumber}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          cardNumber: formatCardNumber(e.target.value),
                        }))
                      }
                      placeholder="1234 5678 9012 3456"
                      className={`pr-10 font-mono ${errors.cardNumber ? "border-destructive" : ""}`}
                      inputMode="numeric"
                      maxLength={19}
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  {errors.cardNumber && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="payment.card.error_state"
                    >
                      {errors.cardNumber}
                    </p>
                  )}
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Expiry (MM/YY)</Label>
                    <Input
                      data-ocid="payment.expiry.input"
                      value={form.expiry}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          expiry: formatExpiry(e.target.value),
                        }))
                      }
                      placeholder="MM/YY"
                      inputMode="numeric"
                      maxLength={5}
                      className={`font-mono ${errors.expiry ? "border-destructive" : ""}`}
                    />
                    {errors.expiry && (
                      <p className="text-xs text-destructive">
                        {errors.expiry}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVV</Label>
                    <Input
                      data-ocid="payment.cvv.input"
                      value={form.cvv}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                        }))
                      }
                      placeholder="123"
                      inputMode="numeric"
                      maxLength={3}
                      type="password"
                      className={`font-mono ${errors.cvv ? "border-destructive" : ""}`}
                    />
                    {errors.cvv && (
                      <p className="text-xs text-destructive">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  data-ocid="payment.pay.primary_button"
                  onClick={handlePay}
                  disabled={paymentState === "processing"}
                  className="w-full bg-primary text-primary-foreground text-base font-semibold h-11"
                >
                  {paymentState === "processing" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay ₹{formatINRNumber(planAmount)}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {isLiveMode
                      ? "Live payment processing"
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
