# LekhyaAI — Phase 2C

## Current State

LekhyaAI is a full-stack GST accounting SaaS built on ICP/Motoko backend + React frontend. Version 38 is live with:
- Full accounting modules (Dashboard, Invoices, Ledger, GST Reports, P&L, Balance Sheet, etc.)
- Marketing website at `/` and accounting app at `/app`
- SuperUser/Developer mode (PIN: LEKHYA2024) with settings at `/app/superuser-settings`
- Floating calculator and AI widget
- Llama Vision OCR invoice scanner
- RBAC for business users (Admin/Accountant/CA roles)

## Requested Changes (Diff)

### Add

1. **Onboard Portal** (`/onboard`) — SuperUser-only client management system with:
   - Client list with status (Active / Trial / Suspended)
   - Add/Edit client form with all onboarding fields: Business name, Contact person, Phone, Email, GSTIN, State, Industry, Address, Selected plan, Notes
   - AI-assisted field suggestion (pre-fill industry defaults using Llama)
   - Assign webapp access to client (generate access token / client ID)
   - Client detail view with their users and subscription info

2. **Quotation Form** (`/onboard/quotation`) — For generating deployment quotes:
   - Pricing breakup: per-user fee, per-invoice fee, Tally import volume, development charges, server charges
   - GST (18%) applied on top
   - Loyalty discount field (configurable %)
   - Generated quote preview (printable)
   - All prices are editable by SuperUser in SuperUser Settings

3. **Subscription Pricing Editor** (in SuperUser Settings page) — New section:
   - Editable pricing for all tiers (Starter, Professional, Enterprise) — monthly and annual
   - Per-user rate, per-invoice rate, Tally import tier pricing
   - Development charges (one-time), server charges (monthly)
   - GST rate override (default 18%)
   - Save prices to localStorage; these populate both the marketing website pricing and quotation form

4. **Dummy Payment Gateway** (`/app/payment-checkout`) — Simulated Razorpay/Stripe checkout UI:
   - Plan selection card
   - Payment form: card number, expiry, CVV, name on card
   - "Pay Now" button that simulates success with confetti animation
   - API key placeholder in SuperUser Settings (already present, needs wiring to show "LIVE" vs "TEST" badge)

5. **Auto-Backup Settings** (SuperUser Settings — already has UI, needs backend wiring):
   - "Run Backup Now" button that exports all localStorage data as a JSON file download
   - Scheduled reminder: shows a toast/notification when backup is due (based on frequency setting)
   - Last backup timestamp display

6. **WhatsApp & Email Send Actions** (in Invoices, P&L Report, GST Reports pages):
   - "Send via WhatsApp" button: opens `wa.me/{phone}?text={AI-drafted message}` link (no API needed)
   - "Send via Email" button: opens `mailto:{email}?subject=...&body=...` link (no SMTP needed yet)
   - AI drafts both the WhatsApp message and email body using Llama with the actual invoice/report data
   - Phone/email pulled from customer record on invoice; user can edit before sending

7. **Full RBAC Matrix** (in `/app/users` page) — Editable module+feature permission grid:
   - Rows: all 20+ modules (Dashboard, Invoices, Customers, Vendors, Products, Expenses, GST Reports, Ledger, P&L, Balance Sheet, Bank Accounts, Petty Cash, Tally Import, GST Filing, B2B Reconciliation, AI Assistant, Journal Entry, Subscriptions, Settings, User Manual, WhatsApp Send, Email Send, PDF Export, OCR Scanner)
   - Columns: Admin (locked full), Accountant, CA
   - Checkboxes to toggle each permission per role
   - "Reset Defaults" button
   - Permissions checked in AppLayout sidebar — hidden menu items for restricted roles

### Modify

- **SuperUser Settings** — Add Subscription Pricing Editor section and "Run Backup Now" button
- **Marketing Page pricing** — Read prices from editable pricing config (SuperUser can update)
- **AppLayout sidebar** — Respect RBAC permissions: hide menu items user doesn't have access to
- **Invoices page** — Add "Send via WhatsApp" and "Send via Email" buttons on invoice detail/row actions
- **P&L Report, GST Reports pages** — Add "Send via WhatsApp" and "Send via Email" action buttons
- **App.tsx** — Add `/onboard`, `/onboard/quotation`, `/app/payment-checkout` routes

### Remove

- Nothing removed

## Implementation Plan

1. Create `utils/rbac.ts` — RBAC permission store (localStorage), default permissions, check functions
2. Create `utils/pricingConfig.ts` — Editable pricing store for SuperUser
3. Create `utils/sendActions.ts` — WhatsApp/Email deep-link generators using Llama for AI drafting
4. Create `utils/backupUtils.ts` — Export all localStorage data as JSON download
5. Create `pages/OnboardingPortalPage.tsx` — Client management portal (SuperUser only)
6. Create `pages/QuotationPage.tsx` — Quotation form + preview
7. Create `pages/PaymentCheckoutPage.tsx` — Dummy payment checkout simulation
8. Update `pages/SuperuserSettingsPage.tsx` — Add Subscription Pricing Editor + Backup Now button
9. Update `pages/UsersPage.tsx` — Replace simple RBAC toggle with full module+feature matrix
10. Update `components/AppLayout.tsx` — Apply RBAC to sidebar menu visibility
11. Update `pages/InvoicesPage.tsx` — Add WhatsApp/Email send buttons
12. Update `pages/PLReportPage.tsx` and `GstReportsPage.tsx` — Add WhatsApp/Email send buttons
13. Update `App.tsx` — Register new routes
