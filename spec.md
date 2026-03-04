# LekhyaAI

## Current State
- Full-stack Motoko + React accounting app for Indian SMEs
- Modules: Dashboard, Invoices, Customers, Vendors, Products, Expenses, GST Reports, Ledger, Bank Accounts, Petty Cash, Users/RBAC, P&L Report, Balance Sheet, Settings, Subscription
- AI Assistant page exists but is rule-based only (no real AI, no chat history storage, no per-user personalization)
- No company category database
- No GST rate auto-assignment by company type/product category
- No cash flow prediction
- No floating AI widget on all pages
- Settings has API key section but no Qwen AI wiring

## Requested Changes (Diff)

### Add
- **AI Chat History in Backend**: Store per-user, per-business chat messages (role, content, timestamp) in Motoko backend so conversations persist across sessions and devices
- **Qwen AI Integration (frontend)**: Call Alibaba DashScope API (qwen-turbo / qwen-plus) from the frontend using the user's configured API key stored in Settings; send full conversation history for context
- **Floating AI Assistant Widget**: A collapsible chat bubble fixed to bottom-right on every page so users never leave their workflow to ask a question
- **Company Categories Master List**: Backend storage + frontend admin UI for company categories (Manufacturing, Trading, Services, E-Commerce, Healthcare, Education, Pharma, Construction, Textile, Retail, Restaurant/Food, IT/Software, Transport/Logistics, Agriculture, Real Estate, Finance/NBFC, Export/Import, NGO/Trust, Professional Services, Hospitality) with associated default GST slab and HSN range hints
- **Products/Services per Category**: Each company category has a default list of common products/services with pre-filled HSN code and GST rate; these seed the product catalog when a business sets its category
- **GST Rate Auto-Assignment**: When creating/editing a product, if the company has a category set, suggest the GST rate automatically based on category + product type; user can override manually
- **Cash Flow Prediction**: Dashboard panel showing 3-month cash flow forecast using linear regression on historical invoice + expense data, with "market context" advisory notes
- **Bug Auto-Fix AI Suggestion**: In the AI chat, when the user describes a problem (e.g. "my GST is wrong", "invoice total is off"), the assistant can generate a step-by-step fix checklist based on the business's current data
- **Qwen API Key Settings**: Settings > AI section now has Qwen API key, model selector (qwen-turbo, qwen-plus, qwen-max), temperature, and a "Test Connection" button

### Modify
- **Backend main.mo**: Add `AiChatMessage` type and storage; add `saveChatMessage`, `getChatHistory`, `clearChatHistory` functions; add `CompanyCategory` type and storage with CRUD; add `CategoryProduct` type and storage; add `setBusinessCategory` and `getBusinessCategory` functions
- **AiAssistantPage**: Full redesign as a proper chat interface with conversation history loaded from backend, Qwen AI calls, GST expert persona, and a "Clear History" button
- **AppLayout**: Add floating AI chat bubble (bottom-right) that expands to a mini-chat panel, present on all authenticated pages
- **SettingsPage**: Expand AI & Integrations section with Qwen API key, model, temperature, test connection; add Company Category selection for the active business
- **DashboardPage**: Add cash flow forecast chart panel (3-month projection)
- **ProductsPage**: When creating/editing a product, auto-suggest GST rate based on business category
- **package.json** (frontend): Remove unused `three`, `@react-three/*`, `@types/three`, `react-quill-new`; keep `recharts` (already present)

### Remove
- Unused Three.js and react-quill-new references from package.json (already partially done but still present)

## Implementation Plan
1. Update `main.mo` to add: AiChatMessage type + Map storage, chat CRUD functions, CompanyCategory type + Map, CategoryProduct type + Map, business category association
2. Generate backend (Motoko + bindings)
3. Remove dead packages from frontend package.json
4. Build `CompanyCategoriesPage` with pre-seeded categories and their default product lists
5. Build floating `AiChatWidget` component wired to Qwen API + backend chat history
6. Update `AiAssistantPage` to use full chat history from backend and Qwen AI
7. Update `SettingsPage` with Qwen config (key, model, temperature, test)
8. Update `DashboardPage` with cash flow forecast panel
9. Update `ProductsPage` to auto-suggest GST rate from company category
10. Add route for `/company-categories` in App.tsx
11. Wire floating widget into AppLayout
