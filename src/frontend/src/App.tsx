import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import AppLayout from "./components/AppLayout";
import { BusinessProvider, useBusiness } from "./context/BusinessContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AiAssistantPage from "./pages/AiAssistantPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import GstReportsPage from "./pages/GstReportsPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProductsPage from "./pages/ProductsPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import VendorsPage from "./pages/VendorsPage";

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
  component: DashboardPage,
});
const invoicesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/invoices",
  component: InvoicesPage,
});
const customersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/customers",
  component: CustomersPage,
});
const vendorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/vendors",
  component: VendorsPage,
});
const productsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/products",
  component: ProductsPage,
});
const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/expenses",
  component: ExpensesPage,
});
const gstReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gst-reports",
  component: GstReportsPage,
});
const aiAssistantRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/ai-assistant",
  component: AiAssistantPage,
});
const subscriptionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/subscription",
  component: SubscriptionPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    dashboardRoute,
    invoicesRoute,
    customersRoute,
    vendorsRoute,
    productsRoute,
    expensesRoute,
    gstReportsRoute,
    aiAssistantRoute,
    subscriptionRoute,
    settingsRoute,
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
  return (
    <ThemeProvider>
      <AuthGate />
    </ThemeProvider>
  );
}
