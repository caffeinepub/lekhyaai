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
import SplashScreen from "./components/SplashScreen";
import { BusinessProvider, useBusiness } from "./context/BusinessContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import LoginPage from "./pages/LoginPage";
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
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  ),
});
const invoicesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/invoices",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <InvoicesPage />
    </Suspense>
  ),
});
const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/customers",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CustomersPage />
    </Suspense>
  ),
});
const vendorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/vendors",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <VendorsPage />
    </Suspense>
  ),
});
const productsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/products",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProductsPage />
    </Suspense>
  ),
});
const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/expenses",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ExpensesPage />
    </Suspense>
  ),
});
const gstReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst-reports",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <GstReportsPage />
    </Suspense>
  ),
});
const ledgerRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/ledger",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <LedgerPage />
    </Suspense>
  ),
});
const aiAssistantRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/ai-assistant",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AiAssistantPage />
    </Suspense>
  ),
});
const subscriptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subscription",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SubscriptionPage />
    </Suspense>
  ),
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  ),
});
const bankAccountsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/bank-accounts",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <BankAccountsPage />
    </Suspense>
  ),
});
const pettyCashRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/petty-cash",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PettyCashPage />
    </Suspense>
  ),
});
const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/users",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <UsersPage />
    </Suspense>
  ),
});
const plReportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports/pl",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PLReportPage />
    </Suspense>
  ),
});
const balanceSheetRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports/balance-sheet",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <BalanceSheetPage />
    </Suspense>
  ),
});

const companyCategoriesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/company-categories",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CompanyCategoriesPage />
    </Suspense>
  ),
});

const tallyImportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/tally-import",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <TallyImportPage />
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

export default function App() {
  const [splashDone, setSplashDone] = useState(
    () => !!sessionStorage.getItem("splash_shown"),
  );

  return (
    <ThemeProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthGate />
    </ThemeProvider>
  );
}
