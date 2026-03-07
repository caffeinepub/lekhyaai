import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";

interface MarketingLayoutProps {
  children?: ReactNode;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Why LekhyaAI", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

function handleSmoothScroll(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (href.startsWith("#")) {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ── Sticky Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <a
            href="/"
            data-ocid="marketing.nav.link"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
              {/* Rupee + leaf icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <text
                  x="4"
                  y="15"
                  fontSize="14"
                  fontWeight="700"
                  fill="white"
                  fontFamily="sans-serif"
                >
                  ₹
                </text>
              </svg>
            </div>
            <span className="font-display text-xl text-foreground">
              LekhyaAI
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-ocid="marketing.nav.link"
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/60"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Access App CTA */}
          <div className="flex items-center gap-3">
            <a
              href="/app"
              data-ocid="marketing.nav.access_app_button"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow hover:opacity-90 transition-opacity"
            >
              Access App
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {/* Mobile menu toggle */}
            <button
              type="button"
              data-ocid="marketing.nav.mobile_menu_button"
              aria-label="Toggle mobile menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-ocid="marketing.nav.mobile.link"
                onClick={(e) => {
                  handleSmoothScroll(e, link.href);
                  setMobileMenuOpen(false);
                }}
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/app"
              data-ocid="marketing.nav.mobile.access_app_button"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Access App →
            </a>
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">
                    ₹
                  </span>
                </div>
                <span className="font-display text-xl text-sidebar-foreground">
                  LekhyaAI
                </span>
              </div>
              <p className="text-sidebar-foreground/70 text-sm leading-relaxed max-w-xs">
                India's smartest AI-powered GST accounting platform for SMEs and
                Chartered Accountants.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sidebar-accent text-sidebar-foreground/80 text-xs font-medium">
                  🇮🇳 Made in India
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sidebar-accent text-sidebar-foreground/80 text-xs font-medium">
                  Atmanirbhar Bharat
                </span>
              </div>
            </div>

            {/* Product links */}
            <div>
              <p className="text-sidebar-foreground text-sm font-semibold uppercase tracking-wider mb-4">
                Product
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Why LekhyaAI", href: "#why" },
                  { label: "Access App", href: "/app" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sidebar-foreground/60 hover:text-sidebar-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sidebar-foreground text-sm font-semibold uppercase tracking-wider mb-4">
                Legal
              </p>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "GST Compliance"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sidebar-foreground/60 text-sm cursor-default">
                        {item}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-sidebar-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sidebar-foreground/50 text-sm text-center sm:text-left">
              © {currentYear} LekhyaAI. All rights reserved.
            </p>
            <p className="text-sidebar-foreground/50 text-sm font-medium italic text-center">
              "Accounting Ko Banaye Easy" — Atmanirbhar Bharat 🇮🇳
            </p>
            <p className="text-sidebar-foreground/40 text-xs">
              Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-sidebar-foreground/60 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { navLinks, handleSmoothScroll };
