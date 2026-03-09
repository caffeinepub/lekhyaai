import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ClientTenant {
    id: bigint;
    status: TenantStatus;
    subscriptionEndDate: Time;
    subscriptionPlan: string;
    businessName: string;
    tenantId: string;
    clientPrincipal: Principal;
    crmLeadId?: bigint;
    provisionedAt: Time;
    subscriptionStartDate: Time;
    contactEmail: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface PaymentRecord {
    id: bigint;
    paymentStatus: string;
    paymentMethod: string;
    clientName: string;
    createdAt: Time;
    subscriptionPlan: string;
    orderId: string;
    clientPrincipal: Principal;
    amountInr: bigint;
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
export interface UserProfile {
    name: string;
    email: string;
}
export enum BusinessRole {
    ca = "ca",
    accountant = "accountant",
    admin = "admin"
}
export enum TenantStatus {
    active = "active",
    expired = "expired",
    suspended = "suspended"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBusiness(name: string, gstin: string, state: string, address: string): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createRazorpayOrder(amountInPaise: bigint, currency: string, receipt: string): Promise<string>;
    getBusinessUsers(businessId: bigint): Promise<Array<BusinessUserRole>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientTenants(): Promise<Array<ClientTenant>>;
    getMyBusinessRole(businessId: bigint): Promise<BusinessRole | null>;
    getMyTenant(): Promise<ClientTenant | null>;
    getPaymentRecords(): Promise<Array<PaymentRecord>>;
    getPaymentSummary(): Promise<{
        expiringIn30Days: bigint;
        suspendedAccounts: bigint;
        totalRevenue: bigint;
        activeSubscriptions: bigint;
    }>;
    getRazorpayKeyId(): Promise<string>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    inviteUserToBusinessRole(businessId: bigint, userPrincipal: Principal, role: BusinessRole): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    isRazorpayConfigured(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    provisionClientTenant(clientPrincipal: Principal, businessName: string, contactEmail: string, subscriptionPlan: string, durationDays: bigint): Promise<string>;
    reactivateTenant(tenantId: string): Promise<void>;
    recordPayment(orderId: string, clientPrincipal: Principal, clientName: string, subscriptionPlan: string, amountInr: bigint, paymentMethod: string): Promise<void>;
    removeBusinessUser(roleId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setRazorpayConfiguration(keyId: string, keySecret: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    suspendTenant(tenantId: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateTenantSubscription(tenantId: string, newPlan: string, additionalDays: bigint): Promise<void>;
}
