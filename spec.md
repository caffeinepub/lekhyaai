# LekhyaAI — Phase A: CRM, Activity Log, Notifications & Real-time Clock

## Current State

LekhyaAI is a fully-built India-first SaaS accounting web app with:
- Marketing site at `/`
- Accounting webapp at `/app` (Dashboard, Invoices, Customers, Vendors, Products, Expenses, Ledger, GST Reports, P&L, Balance Sheet, Bank Accounts, Petty Cash, Journal Entry, Tally Import, B2B Reconciliation, GST Filing Calendar)
- AI Assistant (floating + full-page)
- RBAC matrix (25+ modules, route-level guards)
- SuperUser Settings at `/app/superuser-settings` (PIN: LEKHYA2024)
- Onboarding Portal at `/app/onboard`
- Stripe payment wired end-to-end
- Demo page at `/app/demo`
- Backend: ICP Motoko canister with Business, Customer, Vendor, Product, Invoice, Expense, Payment, GstReport, BankAccount, PettyCash, JournalEntry types

## Requested Changes (Diff)

### Add

**1. SuperUser CRM with Dynamic IDs**
- Backend: `CrmLead` type with fields: id (formatted ENQ-XXXX / FLW-XXXX / ONB-XXXX), name, email, phone, companyName, stage (enquiry | followup | onboarded), kycType (india | overseas), gstin, pan, cin, tinEin, incorporationCert, notes, subscriptionModules (array of selected modules), createdAt
- Backend functions: createCrmLead, getCrmLeads, updateCrmLead, updateLeadStage, deleteCrmLead
- Frontend: `/app/crm` page — Kanban/table view with Enquiry → Follow-up → Onboarded columns, editable KYC drawer, dynamic ID display

**2. Enquiry Form on Marketing Page**
- Frontend addition: Enquiry form section on `/` (MarketingPage) with name, email, phone, company, subscription module dropdown (multi-select), message; submits to backend CRM as ENQ-XXXX lead

**3. Real-time Clock**
- Frontend: Fixed clock component in top-right corner of AppLayout header, shows time in user's local timezone (auto-detected), updates every second, formats as HH:MM:SS with date

**4. Bell Icon Notification System**
- Backend: `Notification` type with id, fromRole (superuser | admin | user), toUserId (Principal), message, isRead, createdAt; functions: createNotification, getMyNotifications, markNotificationRead, markAllRead
- Frontend: Bell icon in AppLayout header with unread badge count; dropdown panel showing notification list; SuperUser can compose and send notifications to any client; Client Admin can send to Client Users

**5. Gantt Chart Activity Log (SuperUser only)**
- Backend: `ActivityLog` type with id, userId (Principal), userName, action, module, timestamp, ipHash; function: logActivity (called on key user actions), getSuperUserActivityLogs (admin-only)
- Frontend: `/app/activity-log` page (SuperUser only, PIN-protected) with Gantt-style timeline chart showing per-user module activity over time, filterable by date range and user; also shows raw log table beneath chart

**6. Email Trigger Placeholders**
- Backend: email trigger functions as stubs (sendWelcomeEmail, sendRenewalReminderEmail, sendBackupRequestEmail) — these accept parameters and log the attempt, returning a status; ready to wire once email component is enabled
- Frontend: UI elements that call these stubs (e.g. "Send Welcome Email" button in CRM on onboarding, renewal reminder display in Activity Log)

### Modify

- **AppLayout header**: Add real-time clock (right side) and notification bell (next to clock); both visible on all `/app` pages
- **MarketingPage**: Add enquiry form section before the footer
- **SuperuserSettingsPage**: Add link/button to CRM page and Activity Log
- **App.tsx**: Add routes for `/app/crm` and `/app/activity-log`
- **Sidebar navigation**: Add "CRM" and "Activity Log" items (visible only in Developer Mode / SuperUser)

### Remove

Nothing removed.

## Implementation Plan

1. **Backend (Motoko)**: Add CrmLead, Notification, ActivityLog types; add CRUD functions for all three; add email stub functions; maintain counters for ENQ/FLW/ONB dynamic IDs
2. **Frontend - Real-time Clock**: Small `RealtimeClock` component, placed in AppLayout header top-right
3. **Frontend - Notification Bell**: `NotificationBell` component with bell icon, unread count badge, dropdown panel; SuperUser compose modal
4. **Frontend - CRM Page**: `/app/crm` with kanban columns (Enquiry, Follow-up, Onboarded), KYC drawer for India/Overseas fields, module selection, lead cards with dynamic IDs
5. **Frontend - Enquiry Form**: Add to MarketingPage as a dedicated section with form fields and module multi-select dropdown
6. **Frontend - Activity Log / Gantt Page**: `/app/activity-log` with a horizontal Gantt-style timeline (using lightweight SVG or recharts) and raw log table, SuperUser-only access
7. **Frontend - Routes + Navigation**: Wire new routes in App.tsx, add sidebar items gated by developer mode
