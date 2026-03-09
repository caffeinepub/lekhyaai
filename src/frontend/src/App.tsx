import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import AppLayout from "./components/AppLayout";
import MarketingLayout from "./components/MarketingLayout";
import RbacGuard from "./components/RbacGuard";
import SplashScreen from "./components/SplashScreen";
import { BusinessProvider, useBusiness } from "./context/BusinessContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import LoginPage from "./pages/LoginPage";
import MarketingPage from "./pages/MarketingPage";
import OnboardingPage from "./pages/OnboardingPage";

// Lazy-loaded pages -- only downloaded when the user navigates to them
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AiAssistantPage = lazy(() => import("./pages/AiAssistantPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const GstReportsPage = lazy(() => import("./pages/GstReportsPage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const LedgerPage = lazy(() => import("./pages/LedgerPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const BankAccountsPage = lazy(() => import("./pages/BankAccountsPage"));
const PettyCashPage = lazy(() => import("./pages/PettyCashPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const PLReportPage = lazy(() => import("./pages/PLReportPage"));
const BalanceSheetPage = lazy(() => import("./pages/BalanceSheetPage"));
const CompanyCategoriesPage = lazy(
  () => import("./pages/CompanyCategoriesPage"),
);
const TallyImportPage = lazy(() => import("./pages/TallyImportPage"));
const GstFilingPage = lazy(() => import("./pages/GstFilingPage"));
const B2bReconciliationPage = lazy(
  () => import("./pages/B2bReconciliationPage"),
);
const UserManualPage = lazy(() => import("./pages/UserManualPage"));
const SuperuserSettingsPage = lazy(
  () => import("./pages/SuperuserSettingsPage"),
);
const OnboardingPortalPage = lazy(() => import("./pages/OnboardingPortalPage"));
const QuotationPage = lazy(() => import("./pages/QuotationPage"));
const PaymentCheckoutPage = lazy(() => import("./pages/PaymentCheckoutPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const CrmPage = lazy(() => import("./pages/CrmPage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const SecurityMonitorPage = lazy(() => import("./pages/SecurityMonitorPage"));
const RazorpayCheckoutPage = lazy(() => import("./pages/RazorpayCheckoutPage"));
const PaymentTrackingPage = lazy(() => import("./pages/PaymentTrackingPage"));
const TenantManagementPage = lazy(() => import("./pages/TenantManagementPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Router Setup ─────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootComponent });

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  );
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  ),
});
const invoicesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/invoices",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="invoices">
        <InvoicesPage />
      </RbacGuard>
    </Suspense>
  ),
});
const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/customers",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="customers">
        <CustomersPage />
      </RbacGuard>
    </Suspense>
  ),
});
const vendorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/vendors",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="vendors">
        <VendorsPage />
      </RbacGuard>
    </Suspense>
  ),
});
const productsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/products",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="products">
        <ProductsPage />
      </RbacGuard>
    </Suspense>
  ),
});
const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/expenses",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="expenses">
        <ExpensesPage />
      </RbacGuard>
    </Suspense>
  ),
});
const gstReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/gst-reports",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="gst-reports">
        <GstReportsPage />
      </RbacGuard>
    </Suspense>
  ),
});
const ledgerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/ledger",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="ledger">
        <LedgerPage />
      </RbacGuard>
    </Suspense>
  ),
});
const aiAssistantRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/ai-assistant",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="ai-assistant">
        <AiAssistantPage />
      </RbacGuard>
    </Suspense>
  ),
});
const subscriptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/subscription",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="subscriptions">
        <SubscriptionPage />
      </RbacGuard>
    </Suspense>
  ),
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <SettingsPage />
      </RbacGuard>
    </Suspense>
  ),
});
const bankAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/bank-accounts",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="bank-accounts">
        <BankAccountsPage />
      </RbacGuard>
    </Suspense>
  ),
});
const pettyCashRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/petty-cash",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="petty-cash">
        <PettyCashPage />
      </RbacGuard>
    </Suspense>
  ),
});
const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/users",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="users">
        <UsersPage />
      </RbacGuard>
    </Suspense>
  ),
});
const plReportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/reports/pl",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="pl-report">
        <PLReportPage />
      </RbacGuard>
    </Suspense>
  ),
});
const balanceSheetRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/reports/balance-sheet",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="balance-sheet">
        <BalanceSheetPage />
      </RbacGuard>
    </Suspense>
  ),
});

const companyCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/company-categories",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="company-categories">
        <CompanyCategoriesPage />
      </RbacGuard>
    </Suspense>
  ),
});

const tallyImportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/tally-import",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="tally-import">
        <TallyImportPage />
      </RbacGuard>
    </Suspense>
  ),
});

const gstFilingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/gst-filing",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="gst-filing">
        <GstFilingPage />
      </RbacGuard>
    </Suspense>
  ),
});

const b2bReconciliationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/b2b-reconciliation",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="b2b-reconciliation">
        <B2bReconciliationPage />
      </RbacGuard>
    </Suspense>
  ),
});

const userManualRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/user-manual",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="user-manual">
        <UserManualPage />
      </RbacGuard>
    </Suspense>
  ),
});

const superuserSettingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/superuser-settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <SuperuserSettingsPage />
      </RbacGuard>
    </Suspense>
  ),
});

const onboardingPortalRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/onboard",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <OnboardingPortalPage />
      </RbacGuard>
    </Suspense>
  ),
});

const quotationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/onboard/quotation",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <QuotationPage />
    </Suspense>
  ),
});

const paymentCheckoutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/payment-checkout",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PaymentCheckoutPage />
    </Suspense>
  ),
});

const demoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/demo",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DemoPage />
    </Suspense>
  ),
});

const crmRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/crm",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <CrmPage />
      </RbacGuard>
    </Suspense>
  ),
});

const activityLogRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/activity-log",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <ActivityLogPage />
      </RbacGuard>
    </Suspense>
  ),
});

const securityMonitorRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/security-monitor",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <SecurityMonitorPage />
      </RbacGuard>
    </Suspense>
  ),
});

const razorpayCheckoutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/razorpay-checkout",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RazorpayCheckoutPage />
    </Suspense>
  ),
});

const paymentTrackingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/payment-tracking",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <PaymentTrackingPage />
      </RbacGuard>
    </Suspense>
  ),
});

const tenantManagementRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/tenant-management",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RbacGuard module="settings">
        <TenantManagementPage />
      </RbacGuard>
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    dashboardRoute,
    invoicesRoute,
    customersRoute,
    vendorsRoute,
    productsRoute,
    companyCategoriesRoute,
    expensesRoute,
    gstReportsRoute,
    ledgerRoute,
    aiAssistantRoute,
    subscriptionRoute,
    settingsRoute,
    bankAccountsRoute,
    pettyCashRoute,
    usersRoute,
    plReportRoute,
    balanceSheetRoute,
    tallyImportRoute,
    gstFilingRoute,
    b2bReconciliationRoute,
    userManualRoute,
    superuserSettingsRoute,
    onboardingPortalRoute,
    quotationRoute,
    paymentCheckoutRoute,
    demoRoute,
    crmRoute,
    activityLogRoute,
    securityMonitorRoute,
    razorpayCheckoutRoute,
    paymentTrackingRoute,
    tenantManagementRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── Auth Gate ────────────────────────────────────────────────────
function AuthGate() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading LekhyaAI…</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <BusinessProvider>
      <BusinessGate />
    </BusinessProvider>
  );
}

function BusinessGate() {
  const { businesses, isLoading } = useBusiness();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading your businesses…
          </p>
        </div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return <OnboardingPage />;
  }

  return <RouterProvider router={router} />;
}

// ─── Detect whether user is on a marketing or app path ────────────
function isMarketingPath(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname;
  // Show marketing site for root / and /marketing
  return (
    path === "/" || path === "/marketing" || path.startsWith("/marketing/")
  );
}

function isDemoPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/app/demo";
}

function isAppPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path.startsWith("/app");
}

export default function App() {
  const [splashDone, setSplashDone] = useState(
    () => !!sessionStorage.getItem("splash_shown"),
  );

  // Marketing site at / and /marketing — no auth required
  if (isMarketingPath()) {
    return (
      <ThemeProvider>
        <Toaster richColors position="top-right" />
        <MarketingLayout>
          <MarketingPage />
        </MarketingLayout>
      </ThemeProvider>
    );
  }

  // Demo page at /app/demo — no auth required, standalone
  if (isDemoPath()) {
    return (
      <ThemeProvider>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          }
        >
          <DemoPage />
        </Suspense>
      </ThemeProvider>
    );
  }

  // App paths under /app — require auth
  if (isAppPath()) {
    return (
      <ThemeProvider>
        <NotificationProvider>
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
          <AuthGate />
        </NotificationProvider>
      </ThemeProvider>
    );
  }

  // Default fallback: show marketing
  return (
    <ThemeProvider>
      <MarketingLayout>
        <MarketingPage />
      </MarketingLayout>
    </ThemeProvider>
  );
}
