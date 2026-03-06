import MandalaDecor from "@/components/MandalaDecor";
import { cn } from "@/lib/utils";
import { type Variants, motion } from "motion/react";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconGstInvoice() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 9h8M8 13h5M8 17h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.15" />
      <text
        x="17.5"
        y="23.5"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        ₹
      </text>
    </svg>
  );
}

function IconAiBrain() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M10 11c0-2.2 1.8-4 4-4s4 1.8 4 4-4 6-4 6-4-3.8-4-6z"
        fill="currentColor"
        opacity="0.2"
      />
      <circle cx="14" cy="11" r="1.5" fill="currentColor" />
      <path
        d="M11 15c1 1.5 5 1.5 6 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M5 14h2M21 14h2M14 5v2M14 21v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function IconLedger() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="22"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="14"
        y1="4"
        x2="14"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="3"
        y1="10"
        x2="25"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <text
        x="5.5"
        y="8.5"
        fontSize="5"
        fill="currentColor"
        fontWeight="600"
        fontFamily="sans-serif"
        opacity="0.7"
      >
        Dr
      </text>
      <text
        x="16"
        y="8.5"
        fontSize="5"
        fill="currentColor"
        fontWeight="600"
        fontFamily="sans-serif"
        opacity="0.7"
      >
        Cr
      </text>
      <path
        d="M6 15h5M6 18h4M6 21h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M16 15h5M17 18h4M18 21h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function IconOcr() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="14"
        height="18"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M7 10h8M7 13h6M7 16h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M20 14l-3.5 3.5M20 14l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx="21"
        cy="11"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="21" cy="11" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function IconTally() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="10"
        height="22"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M17 3h8M17 9h8M17 15h8M17 21h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M13 14l4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 12l2 2-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReconcile() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="10"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="15"
        y="16"
        width="10"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 12v4h12v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M6 8h4M17 19h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.25" />
      <path
        d="M12.5 13.5l3 1M12.5 14.5l3-1"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="Yes"
      className={className}
    >
      <title>Yes</title>
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <path
        d="M5 8l2.5 2.5L11 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PartialIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="Partial"
      className={className}
    >
      <title>Partial</title>
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        d="M5 8h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="No"
      className={className}
    >
      <title>No</title>
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.25"
      />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

// ─── Feature cards ────────────────────────────────────────────────────────────
const features = [
  {
    icon: IconGstInvoice,
    title: "GST-Smart Invoicing",
    description:
      "Auto-calculates CGST + SGST for intra-state and IGST for inter-state transactions. Validates GSTIN in real-time.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: IconAiBrain,
    title: "AI Accountant",
    description:
      "Proprietary AI engine answers GST queries, detects cash flow risks, and suggests tax-saving opportunities in plain language.",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    icon: IconLedger,
    title: "Double-Entry Ledger",
    description:
      "Full chart of accounts, journal entries, trial balance, P&L, and Balance Sheet — all GST-compliant and CA-auditable.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    icon: IconOcr,
    title: "OCR Invoice Scanner",
    description:
      "Upload any invoice image or PDF. AI extracts seller GSTIN, HSN codes, line items, and totals — pre-fills the form instantly.",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
  {
    icon: IconTally,
    title: "Tally Import",
    description:
      "Import your full Tally ERP 9 / Prime history — sales, purchases, customers, vendors — in one click. Zero data loss.",
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
  {
    icon: IconReconcile,
    title: "B2B Reconciliation",
    description:
      "Auto-match invoices between two LekhyaAI users by GSTIN. Raise, accept, or dispute — with a full audit trail.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
];

// ─── Comparison table ─────────────────────────────────────────────────────────
const comparisonRows = [
  {
    feature: "AI-powered GST assistant",
    lekhya: "check",
    tally: "cross",
    excel: "cross",
    other: "partial",
  },
  {
    feature: "OCR invoice scanning",
    lekhya: "check",
    tally: "cross",
    excel: "cross",
    other: "partial",
  },
  {
    feature: "Indian number system (lakh/crore)",
    lekhya: "check",
    tally: "check",
    excel: "cross",
    other: "partial",
  },
  {
    feature: "Mobile-optimized web app",
    lekhya: "check",
    tally: "cross",
    excel: "partial",
    other: "partial",
  },
  {
    feature: "Real-time cash flow forecast",
    lekhya: "check",
    tally: "cross",
    excel: "cross",
    other: "partial",
  },
  {
    feature: "B2B invoice reconciliation",
    lekhya: "check",
    tally: "cross",
    excel: "cross",
    other: "cross",
  },
];

type ComparisonValue = "check" | "partial" | "cross";

function CompCell({
  value,
  highlight,
}: { value: ComparisonValue; highlight?: boolean }) {
  if (value === "check") {
    return (
      <CheckIcon
        className={cn(
          "mx-auto",
          highlight ? "text-primary scale-125" : "text-success",
        )}
      />
    );
  }
  if (value === "partial") {
    return <PartialIcon className="mx-auto text-warning" />;
  }
  return <CrossIcon className="mx-auto text-muted-foreground" />;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    annual: "₹4,990/year",
    description: "Perfect for small businesses getting started with GST.",
    features: [
      "1 business",
      "50 invoices/month",
      "Basic GST reports",
      "GST Filing Calendar",
      "Customer & Vendor management",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹999",
    period: "/month",
    annual: "₹9,990/year",
    description: "Everything growing SMEs and CAs need.",
    features: [
      "3 businesses",
      "Unlimited invoices",
      "AI Accountant Assistant",
      "OCR invoice scanner",
      "Tally data import",
      "B2B reconciliation",
      "Double-entry ledger",
      "P&L & Balance Sheet",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "₹2,499",
    period: "/month",
    annual: "₹24,990/year",
    description: "Unlimited scale for large firms and CA practices.",
    features: [
      "Unlimited businesses",
      "All Professional features",
      "Custom branding",
      "Dedicated CA support",
      "API access",
      "SLA guarantee",
      "Team RBAC management",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

// ─── Tech Stack ───────────────────────────────────────────────────────────────
const techCards = [
  {
    title: "React Frontend",
    subtitle: "TypeScript + Tailwind CSS",
    description:
      "Lightning-fast, mobile-first UI built with React 19 and TypeScript. Responsive across all screen sizes — works beautifully on Android browsers.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.8" />
        <ellipse
          cx="16"
          cy="16"
          rx="13"
          ry="5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="13"
          ry="5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
          transform="rotate(60 16 16)"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="13"
          ry="5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
          transform="rotate(120 16 16)"
        />
      </svg>
    ),
  },
  {
    title: "ICP Blockchain Backend",
    subtitle: "Motoko Smart Contracts",
    description:
      "Data stored on the Internet Computer — a tamper-proof, decentralized blockchain. No central server means zero downtime and full data sovereignty.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <polygon
          points="16,4 28,10 28,22 16,28 4,22 4,10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <polygon
          points="16,9 23,12.5 23,19.5 16,23 9,19.5 9,12.5"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
  {
    title: "Proprietary AI Engine",
    subtitle: "Lekhya Intelligence Layer",
    description:
      "Our in-house AI understands Indian GST law, double-entry accounting, and MSME financial patterns. Trained on Indian business data — not generic finance.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M10 12a6 6 0 0 1 12 0c0 4-6 8-6 8s-6-4-6-8z"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.8" />
        <path
          d="M13 19c1.5 2 4.5 2 6 0"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    ),
  },
  {
    title: "Indian GST Engine",
    subtitle: "Section-aware tax logic",
    description:
      "Built around the CGST/SGST/IGST framework. Understands GSTR-1, GSTR-3B, e-invoicing, HSN codes, and Indian FY (April–March). GST law changes — we update.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="6"
          y="6"
          width="20"
          height="20"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        <text
          x="9.5"
          y="21.5"
          fontSize="14"
          fontWeight="700"
          fill="currentColor"
          fontFamily="sans-serif"
          opacity="0.8"
        >
          ₹
        </text>
        <path
          d="M20 10h4M20 13h4M20 16h3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    ),
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  return (
    <div className="overflow-x-hidden" data-ocid="marketing.page">
      {/* ════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════ */}
      <section
        id="hero"
        data-ocid="marketing.hero.section"
        className="relative min-h-[85vh] flex items-center overflow-hidden"
      >
        {/* Hero background gradient — saffron + teal tones */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.14 0.04 50) 0%, oklch(0.18 0.04 200) 60%, oklch(0.12 0.025 220) 100%)",
          }}
        />
        {/* Subtle grain overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px",
          }}
        />

        {/* Floral mandala corners — theme-reactive via text-primary */}
        <MandalaDecor
          size={220}
          opacity={0.12}
          className="absolute top-0 left-0 text-[oklch(0.65_0.18_65)] pointer-events-none"
          style={{ transform: "translate(-35%, -35%)" }}
        />
        <MandalaDecor
          size={220}
          opacity={0.12}
          className="absolute top-0 right-0 text-[oklch(0.42_0.12_185)] pointer-events-none"
          style={{ transform: "translate(35%, -35%)" }}
        />
        <MandalaDecor
          size={180}
          opacity={0.08}
          className="absolute bottom-0 left-0 text-[oklch(0.65_0.18_65)] pointer-events-none"
          style={{ transform: "translate(-30%, 30%)" }}
        />
        <MandalaDecor
          size={180}
          opacity={0.08}
          className="absolute bottom-0 right-0 text-[oklch(0.42_0.12_185)] pointer-events-none"
          style={{ transform: "translate(30%, 30%)" }}
        />

        {/* Decorative rupee symbols floating */}
        <div className="absolute top-1/4 right-[8%] text-[oklch(0.65_0.18_65)] opacity-8 font-display text-[8rem] select-none pointer-events-none leading-none">
          ₹
        </div>
        <div className="absolute bottom-1/3 left-[5%] text-[oklch(0.42_0.12_185)] opacity-5 font-display text-[5rem] select-none pointer-events-none leading-none">
          ₹
        </div>

        {/* Hero content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            {/* India badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.65_0.18_65)/30] bg-[oklch(0.65_0.18_65)/10] text-[oklch(0.85_0.12_65)] text-sm font-medium">
                🇮🇳 Made for India · GST-Compliant · Atmanirbhar Bharat
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6"
            >
              Accounting Ko{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.78 0.18 65), oklch(0.72 0.15 80))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Banaye Easy
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed mb-10"
            >
              India's smartest AI-powered GST accounting platform for SMEs and
              Chartered Accountants. From invoice scanning to GSTR filing —
              everything in one place, in your language.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="/"
                data-ocid="marketing.hero.access_app_button"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 65), oklch(0.58 0.16 50))",
                  color: "oklch(0.1 0.04 55)",
                  boxShadow: "0 8px 32px oklch(0.65 0.18 65 / 0.35)",
                }}
              >
                Access App
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 9h10M10 5l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <button
                type="button"
                data-ocid="marketing.hero.features_button"
                onClick={() => {
                  document
                    .querySelector("#features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold border border-white/20 text-white/85 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 9l2 2 2-2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                See Features
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeUp}
              className="mt-12 flex flex-wrap gap-6 items-center"
            >
              {[
                { value: "100%", label: "GST Compliant" },
                { value: "Zero", label: "Downtime (ICP)" },
                { value: "₹499", label: "Starting Price" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span
                    className="font-display text-2xl font-bold"
                    style={{ color: "oklch(0.78 0.18 65)" }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-white/50 text-sm">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES SECTION
          ════════════════════════════════════════════ */}
      <section
        id="features"
        data-ocid="marketing.features.section"
        className="py-24 bg-background"
      >
        {/* Corner mandalas */}
        <MandalaDecor
          size={160}
          opacity={0.05}
          className="absolute right-0 text-primary pointer-events-none"
          style={{ transform: "translate(35%, 0)" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Capabilities
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-foreground mb-5"
            >
              Everything Your Business Needs
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              From daily invoicing to annual GST filings — LekhyaAI covers the
              full accounting lifecycle for Indian businesses.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                data-ocid={`marketing.features.card.${i + 1}`}
                className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-card-hover transition-all cursor-default"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-5",
                    feature.bg,
                    feature.color,
                  )}
                >
                  <feature.icon />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          WHY LEKHYAAI SECTION
          ════════════════════════════════════════════ */}
      <section
        id="why"
        data-ocid="marketing.why.section"
        className="py-24"
        style={{
          background:
            "linear-gradient(180deg, oklch(var(--muted)) 0%, oklch(var(--background)) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Comparison
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-foreground mb-5"
            >
              Why LekhyaAI?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              See how LekhyaAI stacks up against the tools most Indian
              businesses rely on today.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto rounded-2xl border border-border/60 shadow-card"
            data-ocid="marketing.why.table"
          >
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-card border-b border-border/60">
                  <th className="text-left px-6 py-4 font-semibold text-foreground">
                    Feature
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-primary bg-primary/5">
                    LekhyaAI
                  </th>
                  <th className="text-center px-4 py-4 font-medium text-muted-foreground">
                    Tally
                  </th>
                  <th className="text-center px-4 py-4 font-medium text-muted-foreground">
                    Excel
                  </th>
                  <th className="text-center px-4 py-4 font-medium text-muted-foreground">
                    Other SaaS
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    data-ocid={`marketing.why.row.${i + 1}`}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      i % 2 === 0 ? "bg-card" : "bg-background",
                    )}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-4 text-center bg-primary/5">
                      <CompCell
                        value={row.lekhya as ComparisonValue}
                        highlight
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CompCell value={row.tally as ComparisonValue} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CompCell value={row.excel as ComparisonValue} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CompCell value={row.other as ComparisonValue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Differentiators */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                emoji: "🇮🇳",
                title: "India-First Design",
                desc: "Built around GSTIN, HSN codes, Indian FY, lakh/crore format, and every quirk of Indian GST law.",
              },
              {
                emoji: "🔒",
                title: "Blockchain Security",
                desc: "Your data lives on the Internet Computer — a decentralized blockchain with no single point of failure.",
              },
              {
                emoji: "📱",
                title: "Mobile-First",
                desc: "Designed for Android browsers. File GST, raise invoices, and check reports from anywhere in India.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border/60"
              >
                <span className="text-3xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TECH STACK SECTION
          ════════════════════════════════════════════ */}
      <section
        id="tech"
        data-ocid="marketing.tech.section"
        className="py-24 bg-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Technology
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-foreground mb-5"
            >
              Built on Modern Technology
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Enterprise-grade infrastructure, Indian-market-grade intelligence.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {techCards.map((tech, i) => (
              <motion.div
                key={tech.title}
                variants={fadeUp}
                data-ocid={`marketing.tech.card.${i + 1}`}
                className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-card-hover transition-shadow group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-5 text-primary group-hover:bg-primary/12 transition-colors">
                  {tech.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  {tech.subtitle}
                </p>
                <h3 className="font-semibold text-foreground text-base mb-3">
                  {tech.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING SECTION
          ════════════════════════════════════════════ */}
      <section
        id="pricing"
        data-ocid="marketing.pricing.section"
        className="py-24"
        style={{
          background:
            "linear-gradient(180deg, oklch(var(--muted)/0.6) 0%, oklch(var(--background)) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Pricing
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-foreground mb-5"
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg"
            >
              All plans include GST. No hidden charges. Cancel anytime.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-success flex-shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M4 7l2.5 2.5L10 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-medium text-success">
                Save 17% with annual billing
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          >
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                data-ocid={`marketing.pricing.card.${i + 1}`}
                className={cn(
                  "relative rounded-2xl p-8 border transition-shadow",
                  plan.highlighted
                    ? "border-primary shadow-[0_0_0_2px_oklch(var(--primary)/0.3),0_8px_32px_oklch(var(--primary)/0.12)] bg-card"
                    : "border-border/60 bg-card hover:shadow-card-hover",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-block px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-display text-xl text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    or {plan.annual} annually
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="mt-0.5 flex-shrink-0 text-success" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/"
                  data-ocid="marketing.pricing.get_started_button"
                  className={cn(
                    "block text-center px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md"
                      : "bg-muted text-foreground hover:bg-muted/70 border border-border",
                  )}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </motion.div>

          {/* GST note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-muted-foreground mt-8"
          >
            All prices are exclusive of 18% GST. Annual billing saves
            ₹1,990/year on the Professional plan.
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CONTACT SECTION
          ════════════════════════════════════════════ */}
      <section
        id="contact"
        data-ocid="marketing.contact.section"
        className="py-24 bg-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-semibold uppercase tracking-widest text-primary mb-3"
            >
              Get In Touch
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-foreground mb-5"
            >
              Ready to Simplify Your Accounting?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg mb-10"
            >
              Talk to our team, request a demo, or start your free trial today.
              We're based in India, for India.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl bg-card border border-border/60 p-8 shadow-card"
              data-ocid="marketing.contact.card"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* Email */}
                <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/40">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="14"
                        height="10"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M3 7l7 5 7-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm mb-1">
                      Email Us
                    </p>
                    <p className="text-muted-foreground text-sm">
                      hello@lekhyaai.in
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Response within 24 hours
                    </p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/40">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "oklch(0.55 0.18 155 / 0.12)",
                      color: "oklch(0.55 0.18 155)",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M7 10.5c.5 2 4 3 5.5 1.5.5-.5 0-1.5-.5-1.5h-1c-.5 0-.5-.5-.5-.5V8c0-.5-.5-.5-.5 0v2"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm mb-1">
                      WhatsApp
                    </p>
                    <p className="text-muted-foreground text-sm">
                      +91 98765 43210
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Monday–Saturday, 10am–6pm IST
                    </p>
                  </div>
                </div>
              </div>

              {/* Made in India tagline */}
              <div
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 65 / 0.08), oklch(0.42 0.12 185 / 0.08))",
                  border: "1px solid oklch(0.65 0.18 65 / 0.2)",
                }}
              >
                <span className="text-2xl">🇮🇳</span>
                <p className="font-semibold text-foreground text-sm">
                  Made in India for India — Atmanirbhar Bharat
                </p>
              </div>

              <div className="mt-6">
                <a
                  href="/"
                  data-ocid="marketing.contact.start_button"
                  className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-md"
                >
                  Start Your Free Trial
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10M9 5l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA BANNER
          ════════════════════════════════════════════ */}
      <section
        className="relative py-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.04 50) 0%, oklch(0.18 0.04 200) 100%)",
        }}
      >
        <MandalaDecor
          size={200}
          opacity={0.1}
          className="absolute top-0 left-0 text-[oklch(0.65_0.18_65)] pointer-events-none"
          style={{ transform: "translate(-40%, -40%)" }}
        />
        <MandalaDecor
          size={200}
          opacity={0.1}
          className="absolute bottom-0 right-0 text-[oklch(0.42_0.12_185)] pointer-events-none"
          style={{ transform: "translate(40%, 40%)" }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl text-white mb-5"
            >
              Accounting ko banaye easy — aaj se
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/70 text-lg mb-10 max-w-xl mx-auto"
            >
              Join hundreds of Indian SMEs and CAs who trust LekhyaAI for
              error-free GST filing and smart business insights.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="/"
                data-ocid="marketing.cta.access_app_button"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 65), oklch(0.58 0.16 50))",
                  color: "oklch(0.1 0.04 55)",
                  boxShadow: "0 8px 32px oklch(0.65 0.18 65 / 0.35)",
                }}
              >
                Access App — Free Trial
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
