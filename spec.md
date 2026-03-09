# LekhyaAI — Phase C

## Current State

The app has a full accounting platform with:
- Motoko backend with Stripe payment integration, business/invoice/customer/vendor/product/expense/GST report/bank/petty cash/journal entry operations
- Frontend with 32 pages including CRM, Activity Log, Security Monitor, Notifications, SuperUser Settings
- Phase A: CRM (ENQ/FLW/ONB IDs), KYC fields, Enquiry Form, Bell notifications, Activity Gantt Log
- Phase B: Security monitoring daemon, password-protected backup, renewal reminders (all frontend/localStorage)
- Stripe payment wired with backend outcalls
- All data is per-user via ICP principal, NOT true multi-tenant isolation

## Requested Changes (Diff)

### Add

1. **Razorpay Onboarding Flow**
   - New `/app/razorpay-checkout` page with subscription plan selection (Basic/Professional/Enterprise with Indian pricing in INR)
   - Razorpay-styled checkout UI (order summary, contact details, UPI/card/netbanking options shown as UI mock with real API call structure)
   - Backend: `razorpayConfig` storage for key_id/key_secret, `createRazorpayOrder` function (HTTP outcall to Razorpay Orders API), `verifyRazorpayPayment` function
   - SuperUser Settings: Razorpay Key ID + Secret input fields with save/status indicator
   - On successful payment (simulated + real when key is live): auto-provision client tenant, send welcome email placeholder

2. **Client Tenant Provisioning**
   - Backend: `ClientTenant` type with tenantId, clientPrincipal, businessName, subscriptionPlan, subscriptionStart, subscriptionEnd, status (active/suspended/expired), provisionedAt
   - `provisionClientTenant` function — called post-payment, creates isolated tenant record
   - `getClientTenants` — SuperUser only — returns all tenants
   - `getMyTenant` — returns caller's tenant info
   - `suspendTenant` / `reactivateTenant` — SuperUser only
   - All business data read/write functions enhanced to check tenant status (active tenants only)

3. **SuperUser Payment Tracking Dashboard**
   - New `/app/payment-tracking` page (SuperUser only)
   - Table of all Razorpay payments: order ID, client name, plan, amount (INR), date, status
   - Revenue summary cards: total revenue, active subscriptions, expiring in 30 days, suspended accounts
   - Export to CSV functionality
   - Payment records stored in backend: `PaymentRecord` type with orderId, clientPrincipal, plan, amountInr, status, createdAt

4. **Enhanced Multi-Tenancy UI**
   - New `/app/tenant-management` page (SuperUser only)
   - List all onboarded tenants with status badges (Active/Suspended/Expired/Expiring Soon)
   - Quick actions: Suspend, Reactivate, View Details, Extend Subscription
   - Tenant detail modal: subscription info, usage stats (invoice count, user count), KYC info from CRM
   - Link CRM lead to tenant record (onboarded leads show tenant ID)

### Modify

- `SuperuserSettingsPage.tsx`: Add Razorpay section with Key ID/Secret fields and connection test button
- `OnboardingPage.tsx` or new `ClientOnboardingFlow.tsx`: Update checkout to use Razorpay instead of Stripe
- `PaymentCheckoutPage.tsx`: Swap to Razorpay flow with INR pricing
- `App.tsx`: Add routes for `/app/razorpay-checkout`, `/app/payment-tracking`, `/app/tenant-management`
- Sidebar navigation: Add "Payment Tracking" and "Tenant Management" under SuperUser section
- CRM leads: Show linked tenant badge if lead has been onboarded

### Remove

- Nothing removed; Stripe remains as an alternative payment option

## Implementation Plan

1. Generate Motoko backend with Razorpay HTTP outcall, ClientTenant type, PaymentRecord type, tenant CRUD, payment tracking
2. Select `http-outcalls` component (already present but need to confirm)
3. Build frontend:
   a. Razorpay checkout page with INR plan cards and order creation flow
   b. Payment tracking dashboard (SuperUser)
   c. Tenant management page (SuperUser)
   d. Update SuperUser Settings with Razorpay config section
   e. Update sidebar to include new SuperUser routes
   f. Wire Razorpay config save to backend
