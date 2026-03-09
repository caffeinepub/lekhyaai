/**
 * Extended backend types.
 * Re-exports everything from backend.d and adds missing types that the
 * backend interface no longer exposes (they are used by existing pages).
 */
import type { Principal } from "@icp-sdk/core/principal";

// Re-export value-types (enums) from backend.d so they can be used as values
export { BusinessRole, TenantStatus, UserRole } from "../backend.d";

// Re-export pure types from backend.d
export type {
  BusinessUserRole,
  ClientTenant,
  http_header,
  http_request_result,
  None,
  Option,
  PaymentRecord,
  ShoppingItem,
  Some,
  StripeConfiguration,
  StripeSessionStatus,
  Time,
  TransformationInput,
  TransformationOutput,
  UserProfile,
  backendInterface,
} from "../backend.d";

// ─── Missing Enums ─────────────────────────────────────────────────────────────

export enum InvoiceStatus {
  paid = "paid",
  sent = "sent",
  overdue = "overdue",
  draft = "draft",
}

export enum AccountType {
  current = "current",
  savings = "savings",
  creditCard = "creditCard",
  overdraft = "overdraft",
}

export enum PettyCashTransactionType {
  receipt = "receipt",
  payment = "payment",
}

export enum AccountGroup {
  Assets = "Assets",
  Liabilities = "Liabilities",
  Capital = "Capital",
  Revenue = "Revenue",
  Expenses = "Expenses",
}

export enum LeadStage {
  enquiry = "enquiry",
  followup = "followup",
  onboarded = "onboarded",
}

export enum KycType {
  india = "india",
  overseas = "overseas",
}

export enum SubscriptionTier {
  free = "free",
  paid = "paid",
}

// ─── Missing Interfaces ────────────────────────────────────────────────────────

export interface Business {
  id: bigint;
  owner: Principal;
  name: string;
  createdAt: bigint;
  state: string;
  gstin: string;
  address: string;
}

export interface InvoiceItem {
  id: bigint;
  invoiceId: bigint;
  productId: bigint;
  description: string;
  quantity: bigint;
  unitPrice: bigint;
  gstRate: bigint;
  cgst: bigint;
  sgst: bigint;
  igst: bigint;
  totalAmount: bigint;
}

export interface Invoice {
  id: bigint;
  status: InvoiceStatus;
  businessId: bigint;
  cgst: bigint;
  igst: bigint;
  createdAt: bigint;
  sgst: bigint;
  dueDate: bigint;
  invoiceDate: bigint;
  invoiceNumber: string;
  totalAmount: bigint;
  customerId: bigint;
  subtotal: bigint;
  items?: InvoiceItem[];
}

export interface Expense {
  id: bigint;
  businessId: bigint;
  vendorId: bigint | null;
  category: string;
  amount: bigint;
  gstAmount: bigint;
  expenseDate: bigint;
  description: string;
  createdAt: bigint;
}

export interface Customer {
  id: bigint;
  businessId: bigint;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  createdAt: bigint;
}

export interface Vendor {
  id: bigint;
  businessId: bigint;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  createdAt: bigint;
}

export interface Product {
  id: bigint;
  businessId: bigint;
  name: string;
  hsnCode: string;
  gstRate: bigint;
  purchasePrice: bigint;
  sellingPrice: bigint;
  stockQuantity: bigint;
  createdAt: bigint;
}

export interface Payment {
  id: bigint;
  invoiceId: bigint;
  amount: bigint;
  paymentDate: bigint;
  paymentMode: string;
  referenceNo: string;
  createdAt: bigint;
}

export interface GstReport {
  id: bigint;
  businessId: bigint;
  periodStart: bigint;
  periodEnd: bigint;
  totalOutputGst: bigint;
  totalInputGst: bigint;
  netGstPayable: bigint;
  createdAt: bigint;
}

export interface BankAccount {
  id: bigint;
  businessId: bigint;
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountType: AccountType;
  balance: bigint;
  createdAt: bigint;
}

export interface BankTransaction {
  id: bigint;
  bankAccountId: bigint;
  transactionType: "credit" | "debit";
  amount: bigint;
  description: string;
  transactionDate: bigint;
  referenceNo: string;
  createdAt: bigint;
}

export interface PettyCashAccount {
  id: bigint;
  businessId: bigint;
  name: string;
  openingBalance: bigint;
  currentBalance: bigint;
  createdAt: bigint;
}

export interface PettyCashTransaction {
  id: bigint;
  pettyCashAccountId: bigint;
  transactionType: PettyCashTransactionType;
  amount: bigint;
  description: string;
  category: string;
  transactionDate: bigint;
  createdAt: bigint;
}

export interface Account {
  id: bigint;
  businessId: bigint;
  code: string;
  name: string;
  accountGroup: AccountGroup;
  openingBalance: bigint;
  currentBalance: bigint;
  isSystem: boolean;
  createdAt: bigint;
}

export interface JournalEntryLine {
  id: bigint;
  journalEntryId: bigint;
  accountId: bigint;
  debit: bigint;
  credit: bigint;
}

export interface JournalEntry {
  id: bigint;
  businessId: bigint;
  entryDate: bigint;
  narration: string;
  reference: string;
  lines: JournalEntryLine[];
  createdAt: bigint;
}

export interface CrmLead {
  id: bigint;
  stage: LeadStage;
  leadId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  cin: string;
  kycType: KycType;
  modules: string[];
  notes: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Notification {
  id: bigint;
  fromRole: string;
  toRole: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
}

export interface ActivityLog {
  id: bigint;
  userId: string;
  userName: string;
  module: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: bigint;
}

export interface DashboardData {
  totalReceivables: bigint;
  totalPayables: bigint;
  currentMonthOutputGst: bigint;
  currentMonthInputGst: bigint;
  netGstPayable: bigint;
  overdueInvoiceCount: bigint;
  recentInvoices: Invoice[];
}

export interface BalanceSheetReport {
  asOf: bigint;
  assets: { name: string; amount: bigint }[];
  liabilities: { name: string; amount: bigint }[];
  capital: { name: string; amount: bigint }[];
  totalAssets: bigint;
  totalLiabilities: bigint;
  totalCapital: bigint;
}

export interface ProfitAndLossReport {
  periodStart: bigint;
  periodEnd: bigint;
  revenue: { name: string; amount: bigint }[];
  expenses: { name: string; amount: bigint }[];
  totalRevenue: bigint;
  totalExpenses: bigint;
  netProfit: bigint;
}

export interface ReconciliationSummary {
  matched: bigint;
  mismatched: bigint;
  missing: bigint;
  totalInvoices: bigint;
}

export interface SubscriptionStatus {
  invoiceCount: bigint;
  tier: SubscriptionTier;
  productCount: bigint;
  customerCount: bigint;
}
