import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  FileBarChart,
  FileText,
  Import,
  Landmark,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  Settings,
  Shield,
  Tag,
  Truck,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { useTheme } from "../context/ThemeContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { isSuperUserActive } from "../utils/superuser";
import CreateBusinessModal from "./CreateBusinessModal";
import FloatingAiWidget from "./FloatingAiWidget";
import FloatingCalculator from "./FloatingCalculator";
import MandalaDecor from "./MandalaDecor";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/invoices", icon: FileText, label: "Invoices" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/vendors", icon: Truck, label: "Vendors" },
  { path: "/products", icon: Package, label: "Products" },
  { path: "/company-categories", icon: Tag, label: "Company Categories" },
  { path: "/expenses", icon: Receipt, label: "Expenses" },
  { path: "/bank-accounts", icon: Landmark, label: "Bank Accounts" },
  { path: "/petty-cash", icon: Wallet, label: "Petty Cash" },
  { path: "/ledger", icon: BookOpen, label: "Ledger" },
  { path: "/gst-reports", icon: BarChart3, label: "GST Reports" },
  { path: "/gst-filing", icon: CalendarCheck, label: "GST Filing" },
  { path: "/b2b-reconciliation", icon: ArrowLeftRight, label: "B2B Reconcile" },
  { path: "/reports/pl", icon: FileText, label: "P&L Report" },
  {
    path: "/reports/balance-sheet",
    icon: FileBarChart,
    label: "Balance Sheet",
  },
  { path: "/tally-import", icon: Import, label: "Tally Import" },
  { path: "/ai-assistant", icon: Bot, label: "AI Assistant" },
  { path: "/users", icon: UserCog, label: "Users & Access" },
  { path: "/subscription", icon: CreditCard, label: "Subscription" },
  { path: "/settings", icon: Settings, label: "Settings" },
  { path: "/user-manual", icon: BookOpen, label: "User Manual" },
];

// Bottom nav items for mobile (primary 4 + More)
const mobileBottomNav = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/invoices", icon: FileText, label: "Invoices" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/ai-assistant", icon: Bot, label: "AI" },
];

export default function AppLayout() {
  const location = useLocation();
  const { businesses, activeBusiness, setActiveBusinessId } = useBusiness();
  const { clear } = useInternetIdentity();
  const { logoUrl } = useTheme();
  const [createBizOpen, setCreateBizOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isSuperUser = isSuperUserActive();

  // Build nav items dynamically — add SuperUser Settings if in dev mode
  const allNavItems = [
    ...navItems,
    ...(isSuperUser
      ? [{ path: "/superuser-settings", icon: Shield, label: "Dev Settings" }]
      : []),
  ];

  const moreNavItems = allNavItems.filter(
    (n) => !mobileBottomNav.some((m) => m.path === n.path),
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Floral Indian mandala corners — page-level, theme-reactive */}
      {/* Top-left corner */}
      <MandalaDecor
        size={180}
        opacity={0.07}
        className="fixed top-0 left-0 text-primary pointer-events-none z-0"
        style={{ transform: "translate(-35%, -35%)" }}
      />
      {/* Top-right corner */}
      <MandalaDecor
        size={180}
        opacity={0.07}
        className="fixed top-0 right-0 text-primary pointer-events-none z-0"
        style={{ transform: "translate(35%, -35%)" }}
      />
      {/* Bottom-left corner */}
      <MandalaDecor
        size={160}
        opacity={0.06}
        className="fixed bottom-0 left-0 text-primary pointer-events-none z-0"
        style={{ transform: "translate(-35%, 35%)" }}
      />
      {/* Bottom-right corner */}
      <MandalaDecor
        size={160}
        opacity={0.06}
        className="fixed bottom-0 right-0 text-primary pointer-events-none z-0"
        style={{ transform: "translate(35%, 35%)" }}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar shadow-sidebar flex-shrink-0">
        {/* Logo */}
        <div className="relative flex items-center gap-3 px-6 py-5 border-b border-sidebar-border overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="h-8 w-auto max-w-[32px] object-contain flex-shrink-0 rounded"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-display text-base font-bold">
                  L
                </span>
              </div>
            )}
            <div>
              <p className="text-sidebar-foreground font-display text-lg leading-none">
                LekhyaAI
              </p>
              <p className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider font-sans mt-0.5">
                GST Accounting
              </p>
            </div>
          </div>
        </div>

        {/* Business Switcher */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                data-ocid="nav.business_select"
                className="w-full justify-between px-3 py-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 flex-shrink-0 text-sidebar-foreground/60" />
                  <span className="text-sm font-medium truncate">
                    {activeBusiness?.name ?? "Select Business"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {businesses.map((biz) => (
                <DropdownMenuItem
                  key={biz.id.toString()}
                  data-ocid="nav.business_select.item"
                  onClick={() => setActiveBusinessId(biz.id)}
                  className={cn(
                    biz.id === activeBusiness?.id &&
                      "bg-primary/10 text-primary",
                  )}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {biz.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-ocid="nav.add_business_button"
                onClick={() => setCreateBizOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* SuperUser badge */}
        {isSuperUser && (
          <div className="mx-3 mb-1 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-destructive flex-shrink-0" />
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              Developer Mode
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
          {allNavItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            data-ocid="nav.logout_button"
            onClick={clear}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 px-3 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="h-7 w-auto max-w-[28px] object-contain flex-shrink-0 rounded"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-display text-sm font-bold">
                  L
                </span>
              </div>
            )}
            <span className="font-display text-lg text-foreground">
              LekhyaAI
            </span>
          </div>

          {/* Business switcher mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-ocid="nav.mobile_business_select"
                className="max-w-[140px] text-xs h-8"
              >
                <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {activeBusiness?.name ?? "Business"}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {businesses.map((biz) => (
                <DropdownMenuItem
                  key={biz.id.toString()}
                  onClick={() => setActiveBusinessId(biz.id)}
                  className={cn(
                    biz.id === activeBusiness?.id &&
                      "bg-primary/10 text-primary",
                  )}
                >
                  {biz.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateBizOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clear}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileBottomNav.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-ocid={`mobile_nav.${item.label.toLowerCase()}.link`}
                  className="flex flex-col items-center gap-1 py-1 px-3 min-w-0"
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              type="button"
              data-ocid="mobile_nav.more_button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3",
                moreNavItems.some((n) =>
                  n.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(n.path),
                )
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>

        {/* More menu overlay for mobile */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-50 md:hidden"
                onClick={() => setMoreOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50 md:hidden shadow-2xl"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <p className="font-semibold text-foreground">More</p>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  {moreNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center leading-tight">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <CreateBusinessModal
        open={createBizOpen}
        onClose={() => setCreateBizOpen(false)}
      />

      {/* Floating AI Widget - appears on all pages except /ai-assistant */}
      <FloatingAiWidget />

      {/* Floating Calculator - always on all pages */}
      <FloatingCalculator />
    </div>
  );
}
