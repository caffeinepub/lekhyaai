import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Customer,
  DashboardData,
  Expense,
  Invoice,
  InvoiceStatus,
  Product,
  SubscriptionStatus,
  Vendor,
} from "../backend.d";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "./useActor";

// ─── Dashboard ────────────────────────────────────────────────────
export function useDashboard() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<DashboardData>({
    queryKey: ["dashboard", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.getDashboardData(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

// ─── Customers ────────────────────────────────────────────────────
export function useCustomers() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Customer[]>({
    queryKey: ["customers", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getCustomers(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createCustomer(
        activeBusinessId,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateCustomer(
        data.id,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ─── Vendors ──────────────────────────────────────────────────────
export function useVendors() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Vendor[]>({
    queryKey: ["vendors", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getVendors(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateVendor() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createVendor(
        activeBusinessId,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      gstin: string;
      phone: string;
      email: string;
      address: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateVendor(
        data.id,
        data.name,
        data.gstin,
        data.phone,
        data.email,
        data.address,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useDeleteVendor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteVendor(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

// ─── Products ─────────────────────────────────────────────────────
export function useProducts() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Product[]>({
    queryKey: ["products", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getProducts(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      hsnCode: string;
      gstRate: bigint;
      purchasePrice: bigint;
      sellingPrice: bigint;
      stockQuantity: bigint;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createProduct(
        activeBusinessId,
        data.name,
        data.hsnCode,
        data.gstRate,
        data.purchasePrice,
        data.sellingPrice,
        data.stockQuantity,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      hsnCode: string;
      gstRate: bigint;
      purchasePrice: bigint;
      sellingPrice: bigint;
      stockQuantity: bigint;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateProduct(
        data.id,
        data.name,
        data.hsnCode,
        data.gstRate,
        data.purchasePrice,
        data.sellingPrice,
        data.stockQuantity,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Invoices ─────────────────────────────────────────────────────
export function useInvoices() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Invoice[]>({
    queryKey: ["invoices", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getInvoices(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      invoiceNumber: string;
      invoiceDate: bigint;
      dueDate: bigint;
      items: Array<[bigint, string, bigint, bigint, bigint]>;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createInvoice(
        activeBusinessId,
        data.customerId,
        data.invoiceNumber,
        data.invoiceDate,
        data.dueDate,
        data.items,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: InvoiceStatus }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateInvoiceStatus(data.id, data.status);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      invoiceId: bigint;
      amount: bigint;
      paymentDate: bigint;
      paymentMode: string;
      referenceNo: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.addPaymentToInvoice(
        data.invoiceId,
        data.amount,
        data.paymentDate,
        data.paymentMode,
        data.referenceNo,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteInvoice(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["invoices"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Expenses ─────────────────────────────────────────────────────
export function useExpenses() {
  const { actor, isFetching } = useActor();
  const { activeBusinessId } = useBusiness();
  return useQuery<Expense[]>({
    queryKey: ["expenses", activeBusinessId?.toString()],
    queryFn: async () => {
      if (!actor || activeBusinessId === null) return [];
      return actor.getExpenses(activeBusinessId);
    },
    enabled: !!actor && !isFetching && activeBusinessId !== null,
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      vendorId: bigint | null;
      category: string;
      amount: bigint;
      gstAmount: bigint;
      expenseDate: bigint;
      description: string;
    }) => {
      if (!actor || activeBusinessId === null) throw new Error("Not ready");
      return actor.createExpense(
        activeBusinessId,
        data.vendorId,
        data.category,
        data.amount,
        data.gstAmount,
        data.expenseDate,
        data.description,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      category: string;
      amount: bigint;
      gstAmount: bigint;
      expenseDate: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error("Not ready");
      return actor.updateExpense(
        data.id,
        data.category,
        data.amount,
        data.gstAmount,
        data.expenseDate,
        data.description,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// ─── Subscription ─────────────────────────────────────────────────
export function useSubscriptionStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentityHook();
  return useQuery<SubscriptionStatus>({
    queryKey: ["subscription", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) throw new Error("Not ready");
      return actor.getSubscriptionStatus(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 60_000,
  });
}

// Import hook inline to avoid circular dependency
import { useInternetIdentity as useInternetIdentityHook } from "./useInternetIdentity";
