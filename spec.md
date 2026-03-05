# LekhyaAI

## Current State
Full-stack Indian GST accounting web app with: Dashboard, Invoices (with Tesseract.js OCR scanner), Customers, Vendors, Products, Expenses, GST Reports, Ledger (double-entry), Bank Accounts, Petty Cash, Users/RBAC, P&L Report, Balance Sheet, AI Assistant (Llama via Groq), Subscription, Settings, Tally Import, Company Categories, and Master Tenant Portal.

Known issues:
- `package.json` still has dead dependencies: `three`, `@react-three/fiber`, `@react-three/cannon`, `@react-three/drei`, `react-quill-new`, `@types/three` — causing large bundle size and potential build failures.
- OCR scanner uses only Tesseract.js with no cloud AI backend option.
- No B2B invoice reconciliation between LekhyaAI users.
- No GST Filing Calendar or payment tracking.

## Requested Changes (Diff)

### Add
1. **Google Document AI integration** — Settings > AI & Integrations gets a "Document AI" section with Project ID, Location, Processor ID, and API Key fields. If these are set, the OCR scanner uses Google Document AI REST API instead of (or as fallback to) Tesseract.js. The extracted JSON from Document AI is mapped to OcrExtractedData fields (same review form, same product approval flow).
2. **B2B Invoice Reconciliation page** (`/b2b-reconciliation`) — Two-panel interface:
   - Left: "Sent Invoices" — list of invoices you sent where buyer GSTIN matches a LekhyaAI-registered business. Status: Pending Acceptance / Accepted / Disputed.
   - Right: "Received Invoices" — invoices where your business GSTIN is the buyer GSTIN. Accept, Dispute, or Request Correction.
   - Since real cross-user backend sync is not available (all data is per-user canister), this is implemented as a local simulation: user can manually enter a "Received Invoice" by pasting seller GSTIN + invoice number, which gets stored in localStorage and shown in the Received tab. The Sent tab shows outgoing invoices with buyer GSTIN flagged as "B2B".
   - Add sidebar link "B2B Reconciliation".
3. **GST Filing Calendar** (`/gst-filing`) — Calendar-style grid showing every month of the Indian financial year (April–March). For each month:
   - GSTR-1 filed? (toggle + date filed)
   - GSTR-3B filed? (toggle + date filed)  
   - GST Paid amount + payment date
   - Status badges: Filed / Pending / Overdue
   - Auto-computes GST liability for each month from invoice + expense data
   - Shows "GST Due" vs "GST Paid" comparison per month
   - Next due date reminder cards at the top (GSTR-1 due 11th, GSTR-3B due 20th of following month)
   - Export to CSV
   - Add sidebar link "GST Filing".

### Modify
1. **package.json** — Remove: `three`, `@react-three/fiber`, `@react-three/cannon`, `@react-three/drei`, `react-quill-new`, `@types/three`. These are unused in any component.
2. **OcrScanModal.tsx** — Add Google Document AI path: if Settings has Document AI credentials, call the REST API (`https://documentai.googleapis.com/v1/projects/{project}/locations/{location}/processors/{processor}:process`) and map the response to OcrExtractedData. Show which engine was used in the UI ("Tesseract.js" vs "Google Document AI").
3. **SettingsPage.tsx** — Add "Document AI (OCR)" subsection under AI & Integrations with: Project ID, Location (default: us), Processor ID, API Key inputs. Save to localStorage.
4. **AppLayout.tsx** — Add sidebar links for B2B Reconciliation and GST Filing.

### Remove
- Dead 3D and rich-text packages from `package.json` (Three.js, react-quill-new, @types/three).

## Implementation Plan
1. Edit `package.json`: remove `three`, `@react-three/fiber`, `@react-three/cannon`, `@react-three/drei`, `react-quill-new`, `@types/three`.
2. Create `GstFilingPage.tsx` — Indian FY calendar grid, per-month GSTR-1/3B/payment tracking, auto-computed liability from invoice/expense data, export CSV, due date reminders.
3. Create `B2bReconciliationPage.tsx` — Sent B2B invoices (filtered by buyer GSTIN presence) + Received invoices (manual entry, localStorage), Accept/Dispute actions.
4. Update `OcrScanModal.tsx` — Add Google Document AI API call path, read credentials from localStorage, map Document AI entity extraction to OcrExtractedData, show engine badge.
5. Update `SettingsPage.tsx` — Document AI credentials section.
6. Update `AppLayout.tsx` — Add sidebar nav links for `/gst-filing` and `/b2b-reconciliation`.
7. Update `App.tsx` — Add routes for both new pages.
