import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Business {
    id: bigint;
    owner: Principal;
    name: string;
    createdAt: Time;
    state: string;
    gstin: string;
    address: string;
}
export interface Invoice {
    id: bigint;
    status: InvoiceStatus;
    businessId: bigint;
    cgst: bigint;
    igst: bigint;
    createdAt: Time;
    sgst: bigint;
    dueDate: Time;
    invoiceDate: Time;
    invoiceNumber: string;
    totalAmount: bigint;
    customerId: bigint;
    subtotal: bigint;
}
export interface Expense {
    id: bigint;
    expenseDate: Time;
    businessId: bigint;
    createdAt: Time;
    description: string;
    gstAmount: bigint;
    vendorId?: bigint;
    category: string;
    amount: bigint;
}
export interface Customer {
    id: bigint;
    businessId: bigint;
    name: string;
    createdAt: Time;
    email: string;
    gstin: string;
    address: string;
    phone: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface BusinessUserRole {
    id: bigint;
    businessId: bigint;
    createdAt: Time;
    role: BusinessRole;
    invitedBy: Principal;
    userPrincipal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Vendor {
    id: bigint;
    businessId: bigint;
    name: string;
    createdAt: Time;
    email: string;
    gstin: string;
    address: string;
    phone: string;
}
export interface Product {
    id: bigint;
    stockQuantity: bigint;
    purchasePrice: bigint;
    businessId: bigint;
    name: string;
    createdAt: Time;
    sellingPrice: bigint;
    hsnCode: string;
    gstRate: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum BusinessRole {
    ca = "ca",
    accountant = "accountant",
    admin = "admin"
}
export enum InvoiceStatus {
    paid = "paid",
    sent = "sent",
    overdue = "overdue",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPaymentToInvoice(invoiceId: bigint, amount: bigint, paymentDate: Time, paymentMode: string, referenceNo: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBusiness(name: string, gstin: string, state: string, address: string): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCustomer(businessId: bigint, name: string, gstin: string, phone: string, email: string, address: string): Promise<bigint>;
    createExpense(businessId: bigint, vendorId: bigint | null, category: string, amount: bigint, gstAmount: bigint, expenseDate: Time, description: string): Promise<bigint>;
    createInvoice(businessId: bigint, customerId: bigint, invoiceNumber: string, invoiceDate: Time, dueDate: Time, items: Array<[bigint, string, bigint, bigint, bigint]>): Promise<bigint>;
    createProduct(businessId: bigint, name: string, hsnCode: string, gstRate: bigint, purchasePrice: bigint, sellingPrice: bigint, stockQuantity: bigint): Promise<bigint>;
    createVendor(businessId: bigint, name: string, gstin: string, phone: string, email: string, address: string): Promise<bigint>;
    deleteBusiness(id: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteInvoice(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    deleteVendor(id: bigint): Promise<void>;
    generateGstReport(businessId: bigint, periodStart: Time, periodEnd: Time): Promise<bigint>;
    getBusiness(id: bigint): Promise<Business>;
    getBusinessUsers(businessId: bigint): Promise<Array<BusinessUserRole>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer>;
    getCustomers(businessId: bigint): Promise<Array<Customer>>;
    getExpense(id: bigint): Promise<Expense>;
    getExpenses(businessId: bigint): Promise<Array<Expense>>;
    getInvoice(id: bigint): Promise<Invoice>;
    getInvoices(businessId: bigint): Promise<Array<Invoice>>;
    getMyBusinessRole(businessId: bigint): Promise<BusinessRole | null>;
    getMyBusinesses(): Promise<Array<Business>>;
    getOverdueInvoices(businessId: bigint): Promise<Array<Invoice>>;
    getProduct(id: bigint): Promise<Product>;
    getProducts(businessId: bigint): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVendor(id: bigint): Promise<Vendor>;
    getVendors(businessId: bigint): Promise<Array<Vendor>>;
    inviteUserToBusinessRole(businessId: bigint, userPrincipal: Principal, role: BusinessRole): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    removeBusinessUser(roleId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBusiness(id: bigint, name: string, gstin: string, state: string, address: string): Promise<void>;
    updateCustomer(id: bigint, name: string, gstin: string, phone: string, email: string, address: string): Promise<void>;
    updateExpense(id: bigint, category: string, amount: bigint, gstAmount: bigint, expenseDate: Time, description: string): Promise<void>;
    updateInvoiceStatus(id: bigint, status: InvoiceStatus): Promise<void>;
    updateProduct(id: bigint, name: string, hsnCode: string, gstRate: bigint, purchasePrice: bigint, sellingPrice: bigint, stockQuantity: bigint): Promise<void>;
    updateVendor(id: bigint, name: string, gstin: string, phone: string, email: string, address: string): Promise<void>;
}
