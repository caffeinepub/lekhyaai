# LekhyaAI

## Current State

Full-stack Indian GST accounting SaaS with modules: Dashboard, Invoices, Customers, Vendors, Products, Expenses, GST Reports, AI Assistant, Subscription, Settings. Backend is Motoko with complete CRUD for all entities. Frontend is React + TanStack Router.

**Known bugs:**
- "Create Invoice" button fails silently. Root cause: `isIntraState` check uses `selectedCustomer?.address?.includes(businessState)` but `businessState` may be empty string or undefined. Also `businessId` is not passed to `createInvoice` correctly -- the `useCreateInvoice` hook calls `actor.createInvoice(activeBusinessId, ...)` but `activeBusinessId` can be null.
- A secondary issue: the invoice form does not reset `invoiceNumber` when `nextInvoiceNumber` prop changes (stale state).

**Missing features:**
- Double-entry accounting ledger: Chart of Accounts, Journal Entries, Ledger view -- none of these exist in backend or frontend.

## Requested Changes (Diff)

### Add
- **Chart of Accounts (CoA)**: Standard Indian double-entry accounts (Assets, Liabilities, Income, Expenses, Capital). Backend: `ChartOfAccount` type with id, businessId, code, name, accountType, isSystem. CRUD: `createAccount`, `getAccounts`, `deleteAccount`.
- **Journal Entries**: Every financial event (invoice creation, payment, expense) auto-posts a journal entry with debit/credit legs. Backend: `JournalEntry` type with id, businessId, date, narration, reference, entries array (accountId, debit, credit). Functions: `createJournalEntry`, `getJournalEntries`, `getLedgerForAccount`.
- **Ledger Page (`/ledger`)**: Frontend page showing:
  1. Chart of Accounts panel (left sidebar or tabs)
  2. Ledger view for selected account: date, narration, debit, credit, running balance
  3. Summary: total debit, total credit, closing balance
- **Auto-journal posting on invoice creation**: When an invoice is created, post: Dr. Accounts Receivable / Cr. Sales + Cr. GST Payable
- **Auto-journal posting on expense creation**: When an expense is created, post: Dr. Expense Category / Cr. Accounts Payable + Cr. GST Input Credit
- **Auto-journal posting on payment**: When payment added to invoice, post: Dr. Bank/Cash / Cr. Accounts Receivable
- Navigation link for Ledger in AppLayout sidebar

### Modify
- **Fix Create Invoice button**: Ensure `activeBusinessId` is always a valid bigint before submission. Fix `isIntraState` detection: compare customer's state field directly against business state field (not address substring). Add `state` field to Customer for accurate intra/inter-state detection.
- **Invoice form**: Reset `invoiceNumber` state when the modal opens fresh (use `key` prop on modal or reset in `useEffect`).
- **Customer model**: Add `state` field (Indian state) to Customer type in backend and frontend. Update create/update customer forms to include a State dropdown.
- **Intra-state detection**: Use `customer.state === business.state` logic instead of `address.includes(businessState)`.

### Remove
- Nothing removed.

## Implementation Plan

1. **Backend (Motoko)**:
   - Add `state` field to `Customer` type and update `createCustomer`, `updateCustomer`, `getCustomers`
   - Add `ChartOfAccount` type + storage map + CRUD functions (`createAccount`, `getAccounts`, `deleteAccount`, `seedDefaultAccounts`)
   - Add `JournalEntry` + `JournalEntryLine` types + storage map + functions (`createJournalEntry`, `getJournalEntries`, `getLedgerForAccount`)
   - Auto-seed default Indian CoA accounts for each new business
   - Post journal entries automatically in `createInvoice`, `addPaymentToInvoice`, `createExpense`
   - Add `getJournalEntries(businessId)` and `getLedgerForAccount(businessId, accountId)` query functions

2. **Frontend**:
   - Update `backend.d.ts` to reflect new Customer (add `state`), ChartOfAccount, JournalEntry types and new actor methods
   - Fix `CreateInvoiceModal`: use `customer.state` for intra-state check; guard against null `activeBusinessId`
   - Update Customer create/edit forms to include State dropdown
   - Add `useQueries` hooks: `useAccounts`, `useCreateAccount`, `useDeleteAccount`, `useJournalEntries`, `useLedger`
   - Create `LedgerPage.tsx`: Chart of Accounts list on left, ledger entries on right with running balance, debit/credit totals
   - Add `/ledger` route in `App.tsx`
   - Add "Ledger" nav item in `AppLayout`
