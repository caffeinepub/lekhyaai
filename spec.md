# LekhyaAI — Sub-phase 2A

## Current State

LekhyaAI is a full-stack GST accounting web app with:
- 24 pages: Dashboard, Invoices, Customers, Vendors, Products, Expenses, Ledger, GST Reports, GST Filing, B2B Reconciliation, Bank Accounts, Petty Cash, P&L Report, Balance Sheet, AI Assistant, Subscription, Settings, Users & Access, Tally Import, Company Categories, User Manual, Marketing (at /marketing), Onboarding, Login
- Floating AI widget on all pages (shares Llama/Groq chat history with AI Assistant page)
- Indian mandala floral corners on all pages
- Multi-business support with business switcher
- Settings: color themes, branding (logo/signature), AI engine (Groq/Llama), Invoice OCR (Llama Vision), Webhooks
- `package.json` still contains unused packages: `three`, `@react-three/cannon`, `@react-three/drei`, `@react-three/fiber`, `react-quill-new`, `@types/three`

## Requested Changes (Diff)

### Add

1. **SuperUser/Developer mode** — Role-based, same login page. After normal login, if the user enters a secret developer PIN (stored in `localStorage`; default `LEKHYA2024`), their session is flagged as `superuser`. The PIN is changeable in SuperUser Settings. SuperUser mode shows:
   - A visible "Developer Mode" badge in the sidebar header
   - A hidden `SuperUser Settings` nav item (only visible when in superuser mode) at `/superuser-settings`
   - SuperUser Settings page includes: Change Developer PIN, API key management for all third-party integrations (AI, OCR, WhatsApp, Email, Payment Gateway), module on/off toggles per integration, auto-backup settings (backup frequency, backup destination placeholder), and a Developer Notes textarea for internal documentation

2. **Floating Professional Calculator** — A draggable, professional calculator widget that floats above the AI assistant button on all pages. Features:
   - Standard arithmetic: +, -, ×, ÷
   - Percentage button (%)
   - Clear (C) and all-clear (AC)
   - Memory functions: M+, M-, MR, MC
   - Indian number formatting on the display (lakh, crore) up to 15 digits
   - Keyboard input support (numbers, operators, Enter, Escape, Backspace)
   - Minimize/maximize toggle
   - Position: fixed, bottom-right, above the AI widget button

### Modify

- **`package.json`** — Remove `three`, `@react-three/cannon`, `@react-three/drei`, `@react-three/fiber`, `react-quill-new`, `@types/three`
- **`LoginPage.tsx`** — Add a hidden "Developer Access" link (small, subtle, at the bottom of the login form) that opens a modal where the developer enters their PIN to enable superuser mode before logging in (or after)
- **`AppLayout.tsx`** — Show "Developer Mode" badge in sidebar when superuser mode active; add `/superuser-settings` to nav (conditional on superuser mode)

### Remove

- Nothing removed from functionality; only dead packages removed

## Implementation Plan

1. Remove dead packages from `package.json`
2. Create `src/utils/superuser.ts` — utility for superuser mode state (check/set/clear PIN, isActive)
3. Create `src/pages/SuperuserSettingsPage.tsx` — SuperUser Settings page with PIN change, API key management, module toggles, backup settings, developer notes
4. Create `src/components/FloatingCalculator.tsx` — professional calculator with memory, percentage, Indian number formatting, keyboard support
5. Modify `LoginPage.tsx` — add hidden Developer Access trigger + PIN entry modal
6. Modify `AppLayout.tsx` — add superuser badge, add SuperUser Settings nav item (conditional), add FloatingCalculator component
7. Modify `App.tsx` — add route for `/superuser-settings`
8. Validate and deploy
