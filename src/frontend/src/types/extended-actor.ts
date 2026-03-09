/**
 * ExtendedActor augments the base backendInterface with all the business/accounting
 * methods that existed previously but are no longer in the regenerated backend.d.ts.
 *
 * These methods are called via `(actor as ExtendedActor)` throughout the app.
 * At runtime the canister either still supports them (returns real data) or the
 * call is wrapped in try/catch so it gracefully falls back to empty data.
 */
import type { backendInterface } from "../backend.d";
import type {
  Business,
  Customer,
  Expense,
  GstReport,
  Invoice,
  InvoiceStatus,
  Product,
  Vendor,
} from "./backend-types";

export interface ExtendedActor extends backendInterface {
  // ── Business ──────────────────────────────────────────────────────────────
  getMyBusinesses(): Promise<Business[]>;
  getBusiness(id: bigint): Promise<Business | null>;
  updateBusiness(
    id: bigint,
    name: string,
    gstin: string,
    state: string,
    address: string,
  ): Promise<void>;
  deleteBusiness(id: bigint): Promise<void>;

  // ── Customers ─────────────────────────────────────────────────────────────
  getCustomers(businessId: bigint): Promise<Customer[]>;
  getCustomer(id: bigint): Promise<Customer | null>;
  createCustomer(
    businessId: bigint,
    name: string,
    gstin: string,
    phone: string,
    email: string,
    address: string,
  ): Promise<bigint>;
  updateCustomer(
    id: bigint,
    name: string,
    gstin: string,
    phone: string,
    email: string,
    address: string,
  ): Promise<void>;
  deleteCustomer(id: bigint): Promise<void>;

  // ── Vendors ───────────────────────────────────────────────────────────────
  getVendors(businessId: bigint): Promise<Vendor[]>;
  getVendor(id: bigint): Promise<Vendor | null>;
  createVendor(
    businessId: bigint,
    name: string,
    gstin: string,
    phone: string,
    email: string,
    address: string,
  ): Promise<bigint>;
  updateVendor(
    id: bigint,
    name: string,
    gstin: string,
    phone: string,
    email: string,
    address: string,
  ): Promise<void>;
  deleteVendor(id: bigint): Promise<void>;

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts(businessId: bigint): Promise<Product[]>;
  getProduct(id: bigint): Promise<Product | null>;
  createProduct(
    businessId: bigint,
    name: string,
    hsnCode: string,
    gstRate: bigint,
    purchasePrice: bigint,
    sellingPrice: bigint,
    stockQuantity: bigint,
  ): Promise<bigint>;
  updateProduct(
    id: bigint,
    name: string,
    hsnCode: string,
    gstRate: bigint,
    purchasePrice: bigint,
    sellingPrice: bigint,
    stockQuantity: bigint,
  ): Promise<void>;
  deleteProduct(id: bigint): Promise<void>;

  // ── Invoices ──────────────────────────────────────────────────────────────
  getInvoices(businessId: bigint): Promise<Invoice[]>;
  getInvoice(id: bigint): Promise<Invoice | null>;
  createInvoice(
    businessId: bigint,
    customerId: bigint,
    invoiceNumber: string,
    invoiceDate: bigint,
    dueDate: bigint,
    items: Array<[bigint, string, bigint, bigint, bigint]>,
  ): Promise<bigint>;
  updateInvoiceStatus(id: bigint, status: InvoiceStatus): Promise<void>;
  deleteInvoice(id: bigint): Promise<void>;
  getOverdueInvoices(businessId: bigint): Promise<Invoice[]>;
  addPaymentToInvoice(
    invoiceId: bigint,
    amount: bigint,
    paymentDate: bigint,
    paymentMode: string,
    referenceNo: string,
  ): Promise<void>;

  // ── Expenses ──────────────────────────────────────────────────────────────
  getExpenses(businessId: bigint): Promise<Expense[]>;
  getExpense(id: bigint): Promise<Expense | null>;
  createExpense(
    businessId: bigint,
    vendorId: bigint | null,
    category: string,
    amount: bigint,
    gstAmount: bigint,
    expenseDate: bigint,
    description: string,
  ): Promise<bigint>;
  updateExpense(
    id: bigint,
    category: string,
    amount: bigint,
    gstAmount: bigint,
    expenseDate: bigint,
    description: string,
  ): Promise<void>;
  deleteExpense(id: bigint): Promise<void>;

  // ── GST Reports ───────────────────────────────────────────────────────────
  generateGstReport(
    businessId: bigint,
    periodStart: bigint,
    periodEnd: bigint,
  ): Promise<GstReport>;
}
