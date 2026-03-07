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
import SplashScreen from "./components/SplashScreen";
import { BusinessProvider, useBusiness } from "./context/BusinessContext";
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
      <InvoicesPage />
    </Suspense>
  ),
});
const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/customers",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CustomersPage />
    </Suspense>
  ),
});
const vendorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/vendors",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <VendorsPage />
    </Suspense>
  ),
});
const productsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/products",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProductsPage />
    </Suspense>
  ),
});
const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/expenses",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ExpensesPage />
    </Suspense>
  ),
});
const gstReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/gst-reports",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <GstReportsPage />
    </Suspense>
  ),
});
const ledgerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/ledger",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <LedgerPage />
    </Suspense>
  ),
});
const aiAssistantRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/ai-assistant",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AiAssistantPage />
    </Suspense>
  ),
});
const subscriptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/subscription",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SubscriptionPage />
    </Suspense>
  ),
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  ),
});
const bankAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/bank-accounts",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <BankAccountsPage />
    </Suspense>
  ),
});
const pettyCashRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/petty-cash",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PettyCashPage />
    </Suspense>
  ),
});
const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/users",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <UsersPage />
    </Suspense>
  ),
});
const plReportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/reports/pl",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PLReportPage />
    </Suspense>
  ),
});
const balanceSheetRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/reports/balance-sheet",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <BalanceSheetPage />
    </Suspense>
  ),
});

const companyCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/company-categories",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CompanyCategoriesPage />
    </Suspense>
  ),
});

const tallyImportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/tally-import",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <TallyImportPage />
    </Suspense>
  ),
});

const gstFilingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/gst-filing",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <GstFilingPage />
    </Suspense>
  ),
});

const b2bReconciliationRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/b2b-reconciliation",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <B2bReconciliationPage />
    </Suspense>
  ),
});

const userManualRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/user-manual",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <UserManualPage />
    </Suspense>
  ),
});

const superuserSettingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/superuser-settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SuperuserSettingsPage />
    </Suspense>
  ),
});

const onboardingPortalRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/app/onboard",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <OnboardingPortalPage />
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
        <MarketingLayout>
          <MarketingPage />
        </MarketingLayout>
      </ThemeProvider>
    );
  }

  // App paths under /app — require auth
  if (isAppPath()) {
    return (
      <ThemeProvider>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <AuthGate />
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
