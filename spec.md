# LekhyaAI

## Current State

LekhyaAI is a GST-compliant accounting web app for Indian SMEs with:
- Multi-business support (one login, many businesses)
- Invoices (CGST/SGST/IGST, status tracking, OCR scanner)
- Customers, Vendors, Products (HSN + GST rate)
- Expenses with GST input credit
- GST Reports
- Double-entry Ledger with Chart of Accounts (14 pre-seeded accounts) and Journal Entries
- AI Assistant (rule-based)
- Stripe subscription gating (Free / Pro)
- Settings (theme, branding, API integrations)
- Master Tenant Portal (/master)

Backend roles currently: admin / user / guest (from Caffeine authorization component).

Missing modules requested: Bank Accounts (details + opening balance + reconciliation), Petty Cash, RBAC (admin / accountant / CA roles with permissions), enhanced Journal Entry module with narration + pre-loaded General Accounts chart, P&L export, Balance Sheet export.

## Requested Changes (Diff)

### Add

**1. Business Bank Accounts module**
- BankAccount type: id, businessId, bankName, accountNumber, ifscCode, branch, accountType (current/savings/cc/od), openingBalance, openingDate, isActive
- BankTransaction type: id, bankAccountId, date, description, debitAmount, creditAmount, reference, isReconciled, linkedJournalEntryId
- Backend: createBankAccount, getBankAccounts, updateBankAccount, deleteBankAccount
- Backend: createBankTransaction, getBankTransactions, reconcileTransaction (mark as reconciled), getBankReconciliationSummary (book balance, bank balance, unreconciled count)

**2. Petty Cash module**
- PettyCashAccount type: id, businessId, custodian, openingBalance, currentBalance
- PettyCashTransaction type: id, accountId, date, description, amount, category, voucherNumber, type (receipt/payment), approvedBy
- Backend: createPettyCashAccount, getPettyCashAccounts, createPettyCashTransaction, getPettyCashTransactions, replenishPettyCash

**3. RBAC / User Management module**
- BusinessUserRole type: businessId, userPrincipal, role (admin / accountant / ca), invitedBy, createdAt
- Roles and permissions:
  - admin: full access (create, edit, delete, export, manage users)
  - accountant: create/edit invoices, expenses, journal entries, petty cash; view reports; NO delete, NO user management
  - ca: read-only + can post journal entries + can export reports; cannot delete transactions
- Backend: inviteUserToBusinessRole, getBusinessUsers, removeBusinessUser, getMyBusinessRole
- Business ownership check updated to also allow users with assigned roles (not just owner)

**4. Enhanced Journal Entry module**
- JournalEntry type: id, businessId, date, entryNumber, narration, postedBy, isReversed, createdAt
- JournalEntryLine type: id, journalEntryId, accountId, accountName, debit, credit, narration
- Pre-loaded General Chart of Accounts (50 standard accounts covering Assets, Liabilities, Capital, Revenue, Expenses) seeded per business
- Backend: createJournalEntry (with lines + narration), getJournalEntries, getJournalEntry, reverseJournalEntry, getChartOfAccounts, addAccount, updateAccount

**5. P&L Report and Balance Sheet with Export**
- Backend: getProfitAndLoss(businessId, fromDate, toDate) — returns revenue, cost of goods, gross profit, expenses breakdown, net profit
- Backend: getBalanceSheet(businessId, asOfDate) — returns assets, liabilities, equity sections
- Frontend: Export to CSV and printable PDF (using browser print API) on both report pages

### Modify

- **Chart of Accounts**: Expand from 14 to ~50 standard Indian accounts (include GST Payable, GST Receivable, TDS Payable, Salary Payable, Rent, Electricity, Telephone, Petty Cash Account, Bank accounts, Capital accounts, etc.)
- **Journal Entry**: Add narration field (entry-level and line-level), link to bank/petty cash transactions
- **Dashboard**: Add quick-glance widgets for bank balance, petty cash balance, unreconciled transactions count
- **Settings > Users**: Add user role management section (invite users, assign roles, remove users)
- **Sidebar navigation**: Add Bank Accounts, Petty Cash, Users sections

### Remove

Nothing removed.

## Implementation Plan

1. **Backend (main.mo)**: Add BankAccount, BankTransaction, PettyCashAccount, PettyCashTransaction, BusinessUserRole, enhanced JournalEntry/JournalEntryLine, P&L/BalanceSheet query types. Add all CRUD + reconciliation + role management functions. Update business access checks to support multi-role access.

2. **Frontend — Bank Accounts page**: List of bank accounts per business with opening balance. Bank statement-style transaction list. Reconciliation view: two columns (book vs bank), tick off reconciled items, show unreconciled balance diff.

3. **Frontend — Petty Cash page**: Petty cash account card showing current balance. Transaction log with voucher numbers. Replenish button (creates journal entry).

4. **Frontend — Users / RBAC page**: List of users in the business with their roles. Invite by Principal ID. Role badge (Admin/Accountant/CA). Remove user button. Permission matrix display.

5. **Frontend — Journal Entry page**: Enhanced form with entry-level narration, dynamic line rows (add/remove), account selector from Chart of Accounts, Dr/Cr columns, running debit/credit totals, validation (debits = credits). List view with search and date filter.

6. **Frontend — Chart of Accounts**: Expandable list with account groups. Add/edit custom accounts. 50 pre-seeded accounts visible.

7. **Frontend — P&L Report**: Date range selector, revenue/expense breakdown table, net profit row, Export CSV button, Export PDF button (window.print with print-specific CSS).

8. **Frontend — Balance Sheet**: As-of-date picker, assets/liabilities/equity table, Export CSV and PDF buttons.

9. **Frontend — Dashboard**: Add Bank Balance card, Petty Cash Balance card, Unreconciled Transactions alert.

10. **Frontend — Settings > Users**: Invite user form, role assignment, user list table.
