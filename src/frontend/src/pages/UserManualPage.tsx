import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck,
  CreditCard,
  Download,
  FileBarChart,
  FileText,
  Import,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  ScanLine,
  Settings,
  Shield,
  Tag,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useRef, useState } from "react";
import { printElementAsPdf } from "../utils/exportUtils";

// ─── Types ────────────────────────────────────────────────────────
interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────
function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-foreground mb-2 border-b border-border pb-1">
        {title}
      </h3>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Step({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {children}
      </p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex-shrink-0">
        Note:
      </span>
      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
      <span className="text-green-600 dark:text-green-400 text-sm font-semibold flex-shrink-0">
        Tip:
      </span>
      <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
        {children}
      </p>
    </div>
  );
}

// ─── Manual Sections ──────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "introduction",
    title: "Introduction",
    icon: BookOpen,
    content: (
      <div>
        <SectionBlock title="What is LekhyaAI?">
          <p>
            LekhyaAI is an AI-powered GST accounting platform designed
            specifically for Indian SMEs, freelancers, and Chartered
            Accountants. It combines double-entry bookkeeping, GST compliance,
            invoice management, and an intelligent AI assistant — all in one
            place.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Tagline:</strong> Accounting ko
            banaye easy — Accounting Made Easy
          </p>
          <p>
            <strong className="text-foreground">Compliance:</strong> Follows
            Indian GST laws, CGST/SGST/IGST rules, and the Indian financial year
            (April–March).
          </p>
        </SectionBlock>
        <SectionBlock title="Key Features">
          <ul className="list-disc list-inside space-y-1">
            <li>Multi-business management from a single login</li>
            <li>
              GST-compliant invoicing with CGST, SGST, and IGST auto-calculation
            </li>
            <li>Double-entry accounting with Chart of Accounts and Ledger</li>
            <li>AI-powered invoice OCR scanner (Google Cloud Vision)</li>
            <li>AI Accountant powered by Meta Llama 3 via Groq</li>
            <li>GST Filing Calendar with due-date reminders</li>
            <li>P&amp;L Report and Balance Sheet with export</li>
            <li>Tally ERP import (XML / CSV)</li>
            <li>B2B Invoice Reconciliation by GSTIN</li>
            <li>Bank Accounts &amp; Reconciliation</li>
            <li>Petty Cash management</li>
            <li>Role-based access control (Admin, Accountant, CA)</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Supported Platforms">
          <p>
            LekhyaAI is a mobile-optimized web application. It works on any
            modern browser — Chrome, Safari, Firefox — on Android, iPhone, iPad,
            and desktop.
          </p>
          <Note>
            This is a Progressive Web App (PWA). You can add it to your Android
            or iPhone home screen for a near-native experience: open the app in
            Chrome/Safari, tap the browser menu, and select "Add to Home
            Screen".
          </Note>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Building2,
    content: (
      <div>
        <SectionBlock title="Step 1 — Sign In with Internet Identity">
          <div className="space-y-2">
            <Step n={1}>
              Open LekhyaAI in your browser. You will see the login screen with
              the LekhyaAI splash and an "Sign In with Internet Identity"
              button.
            </Step>
            <Step n={2}>
              Click "Sign In with Internet Identity". A new window opens — this
              is the ICP (Internet Computer Protocol) secure authentication
              system, similar to Google Sign-In.
            </Step>
            <Step n={3}>
              If you are new, click "Create Passkey" to set up your account. If
              you have used it before, enter your anchor number and authenticate
              with your device biometrics or security key.
            </Step>
            <Step n={4}>
              Once authenticated, you will be redirected back to LekhyaAI
              automatically.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Step 2 — Create Your First Business">
          <div className="space-y-2">
            <Step n={1}>
              After signing in for the first time, you will see the Business
              Setup screen.
            </Step>
            <Step n={2}>
              Enter your Business Name, GSTIN (optional but recommended), State,
              and Address.
            </Step>
            <Step n={3}>
              Click "Create Business". Your business is now set up and you will
              be taken to the Dashboard.
            </Step>
          </div>
          <Tip>
            You can manage multiple businesses from one login. Use the business
            switcher at the top of the sidebar to switch between businesses.
          </Tip>
        </SectionBlock>
        <SectionBlock title="Step 3 — Add Your Company Branding">
          <div className="space-y-2">
            <Step n={1}>Go to Settings in the sidebar.</Step>
            <Step n={2}>
              Under "Branding", upload your company logo (PNG/JPG/SVG, max 2MB).
              It appears in the sidebar immediately.
            </Step>
            <Step n={3}>
              Upload your authorized signature (PNG/JPG, max 1MB) — used on
              printed invoices.
            </Step>
            <Step n={4}>
              Under "Color Themes", pick a theme (Teal, Saffron, Purple,
              Emerald, Rose, Slate) and toggle Dark/Light mode.
            </Step>
          </div>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: (
      <div>
        <SectionBlock title="Overview">
          <p>
            The Dashboard is your financial command center. It shows a real-time
            snapshot of your business health at a glance.
          </p>
        </SectionBlock>
        <SectionBlock title="Dashboard Cards">
          <ul className="space-y-2">
            <li>
              <strong className="text-foreground">Total Receivables:</strong>{" "}
              Sum of all unpaid (sent/overdue) invoices.
            </li>
            <li>
              <strong className="text-foreground">Total Expenses:</strong> Sum
              of all recorded expenses in the current month.
            </li>
            <li>
              <strong className="text-foreground">Net GST Payable:</strong>{" "}
              Output GST (from sales) minus Input GST (from purchases). This is
              what you owe GSTN.
            </li>
            <li>
              <strong className="text-foreground">Overdue Invoices:</strong>{" "}
              Count of invoices past their due date that are still unpaid.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Cash Flow Forecast">
          <p>
            The 3-month cash flow forecast uses your historical invoice and
            expense data to project future inflows and outflows using a linear
            regression model. Use this to plan working capital requirements.
          </p>
        </SectionBlock>
        <SectionBlock title="Recent Activity">
          <p>
            Shows the last 5 invoices and expenses for quick review. Click any
            row to navigate to the full record.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "invoices",
    title: "Invoices",
    icon: FileText,
    content: (
      <div>
        <SectionBlock title="Creating an Invoice">
          <div className="space-y-2">
            <Step n={1}>
              Go to Invoices in the sidebar. Click "New Invoice".
            </Step>
            <Step n={2}>
              Select a Customer. If not listed, add them from the Customers page
              first.
            </Step>
            <Step n={3}>
              Fill in Invoice Date, Due Date, and Place of Supply. The system
              automatically determines whether to apply CGST+SGST (intra-state)
              or IGST (inter-state) based on the customer's state vs your
              business state.
            </Step>
            <Step n={4}>
              Add line items: select the product, enter quantity, and the rate
              and GST rate auto-fill from your product catalog.
            </Step>
            <Step n={5}>
              Amount in Words and Tax in Words are calculated automatically in
              the Indian number system (e.g., "One Lakh Twenty Thousand Rupees
              Only").
            </Step>
            <Step n={6}>Click "Save Invoice" to create it as a Draft.</Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Invoice Statuses">
          <ul className="space-y-1">
            <li>
              <Badge variant="outline" className="text-xs mr-2">
                Draft
              </Badge>{" "}
              Invoice saved but not finalized.
            </li>
            <li>
              <Badge variant="outline" className="text-xs mr-2">
                Sent
              </Badge>{" "}
              Invoice dispatched to customer.
            </li>
            <li>
              <Badge className="bg-green-100 text-green-700 text-xs mr-2">
                Paid
              </Badge>{" "}
              Full payment received and recorded.
            </li>
            <li>
              <Badge className="bg-red-100 text-red-700 text-xs mr-2">
                Overdue
              </Badge>{" "}
              Past due date, payment not received.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Recording a Payment">
          <div className="space-y-2">
            <Step n={1}>
              Find the invoice in the list (status: Sent or Overdue).
            </Step>
            <Step n={2}>Click the "Pay" button (rupee icon) on that row.</Step>
            <Step n={3}>
              The amount auto-fills. Confirm the payment date and mode (Cash,
              Bank Transfer, UPI, Cheque). Click "Record Payment".
            </Step>
            <Step n={4}>
              The invoice status changes to Paid and the Dashboard Receivables
              update immediately.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="OCR Invoice Scanner">
          <p>
            Save time by scanning a physical or digital invoice instead of
            typing manually.
          </p>
          <div className="space-y-2 mt-2">
            <Step n={1}>Click "Scan Invoice" on the Invoices page.</Step>
            <Step n={2}>
              Upload a clear image (JPG/PNG) or PDF of the invoice.
            </Step>
            <Step n={3}>
              The system uses Google Cloud Vision to extract fields: invoice
              number, date, GSTIN, buyer/seller details, line items with HSN
              codes, and totals.
            </Step>
            <Step n={4}>
              Review the 6-tab form (Buyer, Seller, Header, Items, Totals,
              Bank). Edit any incorrect fields.
            </Step>
            <Step n={5}>
              Click "Add New Products" to approve and add scanned products to
              your catalog, then "Create Invoice" to save.
            </Step>
          </div>
          <Note>
            For best OCR accuracy: use a clear, well-lit photo or a PDF scan at
            300 DPI or higher. Configure your Google Cloud Vision API key in
            Settings &gt; Invoice OCR first.
          </Note>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "customers-vendors",
    title: "Customers & Vendors",
    icon: Users,
    content: (
      <div>
        <SectionBlock title="Managing Customers">
          <div className="space-y-2">
            <Step n={1}>
              Go to Customers in the sidebar. Click "Add Customer".
            </Step>
            <Step n={2}>
              Enter Name, GSTIN, Phone, Email, and State (important for GST type
              calculation), and Address.
            </Step>
            <Step n={3}>
              Click "Save". The customer appears in the list and is available
              when creating invoices.
            </Step>
          </div>
          <Tip>
            Always fill in the Customer's State. LekhyaAI uses this to decide
            whether your invoice should have CGST+SGST (same state) or IGST
            (different state).
          </Tip>
        </SectionBlock>
        <SectionBlock title="Managing Vendors">
          <p>
            Vendors are your suppliers. Go to Vendors and click "Add Vendor".
            Fill in Name, GSTIN, and contact details. Vendors are linked to
            expenses for input GST credit tracking.
          </p>
        </SectionBlock>
        <SectionBlock title="GSTIN Validation">
          <p>
            LekhyaAI validates GSTIN format (15 characters: state code + PAN +
            entity number + Z + check digit). Invalid GSTINs are flagged. The
            first 2 digits automatically determine the state.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "products",
    title: "Products",
    icon: Package,
    content: (
      <div>
        <SectionBlock title="Adding a Product">
          <div className="space-y-2">
            <Step n={1}>
              Go to Products in the sidebar. Click "Add Product".
            </Step>
            <Step n={2}>
              Enter Product Name. The system will suggest an HSN Code and GST
              Rate based on your business category.
            </Step>
            <Step n={3}>
              Enter HSN/SAC Code (8-digit Harmonized System of Nomenclature —
              required for GST compliance), GST Rate (0, 3, 5, 12, 18, or 28%),
              Purchase Price, Selling Price, and Opening Stock Quantity.
            </Step>
            <Step n={4}>Click "Save Product".</Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Stock Management">
          <p>
            Every time you create an invoice with a product, the stock quantity
            reduces automatically. Purchase entries increase stock. Monitor
            stock levels on the Products list — low-stock warnings appear when
            quantity drops below 10.
          </p>
        </SectionBlock>
        <SectionBlock title="Company Categories &amp; GST Master">
          <p>
            Go to Company Categories in the sidebar to view and edit the master
            list of 20 Indian business categories (Manufacturing, IT/Software,
            Healthcare, Restaurant, etc.), each with default products and GST
            rates. Admins can edit rates and add new categories.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "expenses",
    title: "Expenses",
    icon: Receipt,
    content: (
      <div>
        <SectionBlock title="Recording an Expense">
          <div className="space-y-2">
            <Step n={1}>
              Go to Expenses in the sidebar. Click "Add Expense".
            </Step>
            <Step n={2}>
              Select the Vendor (optional but recommended for input GST credit).
            </Step>
            <Step n={3}>
              Select Category (Rent, Utilities, Travel, Office Supplies, etc.),
              enter Amount, GST Amount, Expense Date, and Description/Narration.
            </Step>
            <Step n={4}>
              Click "Save". The expense is recorded and reflected in your
              Dashboard and GST Reports.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Input GST Credit">
          <p>
            Expenses with a GST amount are counted as Input GST. Your Net GST
            Payable = Output GST (from sales) - Input GST (from purchases).
            Recording expenses correctly reduces your GST liability.
          </p>
          <Tip>
            Always enter GST amounts on expenses paid to GST-registered vendors.
            This directly reduces your monthly GST outflow.
          </Tip>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "ledger",
    title: "Ledger & Accounts",
    icon: BookOpen,
    content: (
      <div>
        <SectionBlock title="Chart of Accounts">
          <p>
            LekhyaAI pre-creates 14 standard Indian accounts for every business:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>
              Assets: Cash, Bank, Accounts Receivable, Inventory, Fixed Assets
            </li>
            <li>Liabilities: Accounts Payable, GST Payable, Loans</li>
            <li>Capital: Owner's Capital</li>
            <li>Income: Sales Revenue</li>
            <li>Expenses: Purchases, Salaries, Rent, Utilities</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Double-Entry Accounting">
          <p>
            Every transaction in LekhyaAI creates two entries (Dr and Cr) to
            keep the books balanced. For example, when you create a paid
            invoice:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>Dr Bank / Cash (asset increases)</li>
            <li>Cr Sales Revenue (income increases)</li>
            <li>Cr GST Payable (liability increases)</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Journal Entries">
          <div className="space-y-2">
            <Step n={1}>Go to Ledger &gt; Journal Entries tab.</Step>
            <Step n={2}>Click "New Journal Entry".</Step>
            <Step n={3}>
              Select the accounts from the 50+ standard Indian accounts
              dropdown. Enter Dr (Debit) or Cr (Credit) amount for each line.
            </Step>
            <Step n={4}>
              Add a Narration (entry-level and/or line-level) to explain the
              transaction.
            </Step>
            <Step n={5}>
              Click "Post Entry". The transaction appears in the Ledger view.
            </Step>
          </div>
          <Note>
            Total Debits must equal total Credits before you can post a journal
            entry.
          </Note>
        </SectionBlock>
        <SectionBlock title="Ledger View">
          <p>
            Select any account from the dropdown to see a running balance with
            Dr/Cr columns for every transaction affecting that account.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "gst",
    title: "GST Reports & Filing",
    icon: BarChart3,
    content: (
      <div>
        <SectionBlock title="GST Summary Report">
          <p>
            Go to GST Reports. Set the date range and click "Generate Report".
            You will see:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>Output GST: total GST collected from customers on sales</li>
            <li>Input GST: total GST paid to vendors on purchases</li>
            <li>
              Net GST Payable: Output minus Input — this is your liability to
              GSTN
            </li>
            <li>GSTR-1 style breakdown by invoice</li>
            <li>GSTR-3B style monthly summary</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="GST Filing Calendar">
          <p>
            Go to GST Filing in the sidebar. You will see a 12-month grid for
            the current Indian FY (April–March) with:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>GSTR-1 due: 11th of following month</li>
            <li>GSTR-3B due: 20th of following month</li>
            <li>Status badges: Filed / Partial / Overdue / Pending</li>
            <li>Auto-computed GST liability per month from your data</li>
          </ul>
          <div className="mt-2">
            <Step n={1}>
              Click any month card to mark GSTR-1 or GSTR-3B as filed.
            </Step>
            <Step n={2}>
              Export the filing summary as CSV for your CA's reference.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="GST Compliance Tips">
          <ul className="space-y-1">
            <li>
              File GSTR-1 by the 11th of each month (quarterly option available
              for small taxpayers).
            </li>
            <li>File GSTR-3B and pay GST by the 20th of each month.</li>
            <li>
              Input Tax Credit (ITC) can only be claimed if your vendor has
              filed and paid their GST.
            </li>
            <li>
              Intra-state sales: CGST = SGST = half the GST rate. Inter-state:
              IGST = full rate.
            </li>
          </ul>
          <Tip>
            Use the AI Assistant (type "How much GST do I owe this month?") to
            get an instant calculation from your live data.
          </Tip>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "bank-petty",
    title: "Bank & Petty Cash",
    icon: Landmark,
    content: (
      <div>
        <SectionBlock title="Bank Accounts">
          <div className="space-y-2">
            <Step n={1}>
              Go to Bank Accounts in the sidebar. Click "Add Account".
            </Step>
            <Step n={2}>
              Enter Bank Name, Account Number, IFSC Code, Branch, Account Type
              (Current/Savings), and Opening Balance.
            </Step>
            <Step n={3}>
              Save. Your bank account is now available for payment records.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Bank Reconciliation">
          <p>
            Bank reconciliation matches your book entries (recorded in LekhyaAI)
            with your actual bank statement.
          </p>
          <div className="space-y-2 mt-2">
            <Step n={1}>Open the bank account. Go to the "Reconcile" tab.</Step>
            <Step n={2}>Enter your bank statement closing balance.</Step>
            <Step n={3}>
              Check off each transaction that appears in both your books and the
              bank statement.
            </Step>
            <Step n={4}>
              The "Difference" should reach ₹0 when fully reconciled.
              Outstanding items (in books but not in bank, or vice versa) are
              listed for investigation.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Petty Cash">
          <p>
            Go to Petty Cash. Use this to track small day-to-day cash expenses
            (tea, courier, stationery, etc.) that don't go through the bank.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>Add Cash Receipt (money added to the petty cash box)</li>
            <li>Add Cash Payment (money spent from the petty cash box)</li>
            <li>Each entry gets a voucher number automatically</li>
            <li>Click "Replenish" when the box needs to be topped up</li>
          </ul>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "pl-balance",
    title: "P&L & Balance Sheet",
    icon: FileBarChart,
    content: (
      <div>
        <SectionBlock title="Profit & Loss Report">
          <p>Go to P&amp;L Report in the sidebar.</p>
          <div className="space-y-2 mt-2">
            <Step n={1}>Set the From Date and To Date.</Step>
            <Step n={2}>
              Click "Generate". The P&amp;L shows Revenue, Cost of Goods Sold,
              Gross Profit, Operating Expenses, and Net Profit.
            </Step>
            <Step n={3}>
              Click "Export CSV" or "Export PDF" to download a copy.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Balance Sheet">
          <p>Go to Balance Sheet in the sidebar.</p>
          <div className="space-y-2 mt-2">
            <Step n={1}>Select the date for the Balance Sheet snapshot.</Step>
            <Step n={2}>
              The sheet shows Assets (Current + Fixed), Liabilities (Current +
              Long-term), and Capital. Total Assets must equal Total Liabilities
              + Capital.
            </Step>
            <Step n={3}>Click "Export CSV" or "Export PDF" to download.</Step>
          </div>
          <Note>
            Balance Sheet accuracy depends on all journal entries being
            correctly posted. Always ensure your Chart of Accounts is mapped
            correctly before sharing with stakeholders.
          </Note>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "tally",
    title: "Tally Import",
    icon: Import,
    content: (
      <div>
        <SectionBlock title="Importing from Tally ERP 9 / Prime">
          <p>
            LekhyaAI can import your existing Tally data so you don't start from
            scratch.
          </p>
        </SectionBlock>
        <SectionBlock title="Export from Tally">
          <div className="space-y-2">
            <Step n={1}>Open Tally ERP 9 or Tally Prime.</Step>
            <Step n={2}>
              For Sales: Gateway of Tally &gt; Display &gt; Account Books &gt;
              Sales Register. Press Alt+E to export. Select XML or CSV format.
            </Step>
            <Step n={3}>
              For Purchase data: same steps via Purchase Register.
            </Step>
            <Step n={4}>
              For Ledger / Master data: Gateway of Tally &gt; Export &gt;
              Masters &gt; Ledger.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Import into LekhyaAI">
          <div className="space-y-2">
            <Step n={1}>Go to Tally Import in the sidebar.</Step>
            <Step n={2}>
              Click "Upload File" and select your Tally XML or CSV export.
            </Step>
            <Step n={3}>
              LekhyaAI parses the file and shows a preview table with record
              types (Invoice, Expense, Customer, Vendor) and badges.
            </Step>
            <Step n={4}>Uncheck any rows you don't want to import.</Step>
            <Step n={5}>
              Click "Import Selected". The data is created in your active
              business.
            </Step>
          </div>
          <Tip>
            Download the sample CSV from the Tally Import page to see the exact
            column format required for a manual import.
          </Tip>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "b2b",
    title: "B2B Reconciliation",
    icon: ArrowLeftRight,
    content: (
      <div>
        <SectionBlock title="What is B2B Reconciliation?">
          <p>
            B2B Reconciliation helps you match invoices you raised with what
            your buyers (who are also LekhyaAI users) have recorded on their
            end. This is required for accurate ITC (Input Tax Credit) matching
            under GST.
          </p>
        </SectionBlock>
        <SectionBlock title="Sent Invoices (as Seller)">
          <p>
            The "Sent (B2B)" tab shows all invoices raised to GSTIN-registered
            customers. Each invoice shows its reconciliation status:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-0.5">
            <li>
              <strong className="text-foreground">Pending:</strong> Not yet
              acknowledged by buyer.
            </li>
            <li>
              <strong className="text-foreground">Accepted:</strong> Buyer has
              confirmed the invoice.
            </li>
            <li>
              <strong className="text-foreground">Disputed:</strong> Buyer
              raised a discrepancy.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Received Invoices (as Buyer)">
          <p>
            The "Received Invoices" tab lets you log invoices you received from
            your vendors. Enter the seller's GSTIN, invoice number, and amount.
            Mark as Accepted or Disputed. This feeds into your Input Tax Credit
            verification.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Bot,
    content: (
      <div>
        <SectionBlock title="Llama AI Accountant">
          <p>
            The AI Assistant is powered by Meta Llama 3 via Groq and acts as
            your personal Indian Chartered Accountant. It uses your live
            business data (invoices, expenses, GST totals) to give context-aware
            answers.
          </p>
        </SectionBlock>
        <SectionBlock title="Setting Up the AI">
          <div className="space-y-2">
            <Step n={1}>Go to Settings &gt; AI Engine.</Step>
            <Step n={2}>
              Get a free API key from{" "}
              <strong className="text-foreground">console.groq.com</strong> (no
              credit card required).
            </Step>
            <Step n={3}>
              Paste your Groq API key in the "API Key" field and click "Save API
              Key".
            </Step>
            <Step n={4}>
              Select your preferred model: Llama 3 8B (fast), 70B (smart), or
              3.3 (latest).
            </Step>
            <Step n={5}>Click "Test Connection" to confirm it's working.</Step>
          </div>
        </SectionBlock>
        <SectionBlock title="What You Can Ask">
          <ul className="list-disc list-inside space-y-1">
            <li>"How much GST do I owe this month?"</li>
            <li>"Who hasn't paid me? List overdue invoices."</li>
            <li>"What is my net profit for April?"</li>
            <li>"Explain GSTR-3B filing steps"</li>
            <li>"What is the HSN code for cotton fabric?"</li>
            <li>
              "Should I apply CGST+SGST or IGST for a sale to Maharashtra?"
            </li>
            <li>"How can I reduce my GST liability legally?"</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Floating AI Widget">
          <p>
            A pulsing chat bubble appears at the bottom-right corner of every
            page. Tap it to ask a quick question without leaving your current
            workflow. Chat history is saved per user and per business.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "users-rbac",
    title: "Users & Access (RBAC)",
    icon: UserCog,
    content: (
      <div>
        <SectionBlock title="Roles">
          <ul className="space-y-3">
            <li>
              <Badge className="bg-red-100 text-red-700 border-red-200 mb-1">
                Admin
              </Badge>
              <p>
                Full access to all modules. Can invite/remove users, change
                settings, and edit the permission matrix.
              </p>
            </li>
            <li>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-1">
                Accountant
              </Badge>
              <p>
                Can manage invoices, expenses, ledger, bank accounts, and
                generate reports. Cannot manage users or billing.
              </p>
            </li>
            <li>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-1">
                CA (Chartered Accountant)
              </Badge>
              <p>
                Read-only access + GST report generation + export. Cannot create
                or modify transactions.
              </p>
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Inviting a User">
          <div className="space-y-2">
            <Step n={1}>Go to Users &amp; Access in the sidebar.</Step>
            <Step n={2}>Click "Invite User".</Step>
            <Step n={3}>
              Enter the user's Internet Identity Principal ID (the user can find
              this in their Profile or by logging into identity.ic0.app).
            </Step>
            <Step n={4}>
              Select their role (Accountant or CA). Click "Send Invite".
            </Step>
            <Step n={5}>
              The user will see your business the next time they log in.
            </Step>
          </div>
        </SectionBlock>
        <SectionBlock title="Editing the Permission Matrix (Admin only)">
          <div className="space-y-2">
            <Step n={1}>
              Go to Users &amp; Access. Scroll down to "Role Permissions".
            </Step>
            <Step n={2}>
              Click "Edit Matrix" (visible only to Admins and Owners).
            </Step>
            <Step n={3}>
              Click any check (✓) or X cell to toggle that permission for the
              Accountant or CA role. The Admin column is always fully enabled
              and cannot be restricted.
            </Step>
            <Step n={4}>
              Click "Save Changes" to apply. Click "Reset" to restore defaults
              at any time.
            </Step>
          </div>
          <Note>
            Permission changes are stored in this browser. They apply
            immediately to all users of this business. Changes persist across
            sessions.
          </Note>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    content: (
      <div>
        <SectionBlock title="Business Settings">
          <p>
            Update your Business Name, GSTIN, State, and Address. These appear
            on all invoices and reports. Keeping GSTIN accurate is critical for
            GST compliance.
          </p>
        </SectionBlock>
        <SectionBlock title="Color Themes & Appearance">
          <p>
            Choose from 6 preset themes (Teal, Saffron, Purple, Emerald, Rose,
            Slate) and toggle Dark / Light mode. Changes apply instantly and are
            saved to this device.
          </p>
        </SectionBlock>
        <SectionBlock title="Branding">
          <p>
            Upload Company Logo (appears in sidebar and on invoices) and
            Authorized Signature (appears on printed invoices). Formats: PNG,
            JPG, SVG. Max 2MB for logo, 1MB for signature.
          </p>
        </SectionBlock>
        <SectionBlock title="AI Engine (Llama / Groq)">
          <p>
            Paste your Groq API key here to activate the Llama-powered AI
            Accountant. Without a key, the assistant uses rule-based responses.
            Get a free key at console.groq.com.
          </p>
        </SectionBlock>
        <SectionBlock title="Invoice OCR (Google Cloud Vision)">
          <p>
            Paste your Google Cloud Vision API key here to enable high-accuracy
            invoice scanning. Without a key, the scanner falls back to
            browser-based Tesseract OCR (lower accuracy). See the Getting
            Started section for step-by-step GCP setup instructions.
          </p>
        </SectionBlock>
        <SectionBlock title="Webhooks">
          <p>
            Configure webhook endpoints to receive real-time notifications when
            invoices are created, payments are recorded, or expenses are added.
            Useful for integrating with external systems.
          </p>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "subscription",
    title: "Subscription",
    icon: CreditCard,
    content: (
      <div>
        <SectionBlock title="Plans">
          <ul className="space-y-3">
            <li>
              <strong className="text-foreground">Free Plan:</strong> Limited to
              50 invoices/month, 1 business, 1 user.
            </li>
            <li>
              <strong className="text-foreground">
                Pro Plan (₹999/month or ₹9,999/year):
              </strong>{" "}
              Unlimited invoices, unlimited businesses, up to 5 users, AI
              Assistant, OCR scanner, all reports, and priority support.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Upgrading">
          <div className="space-y-2">
            <Step n={1}>Go to Subscription in the sidebar.</Step>
            <Step n={2}>
              Click "Upgrade to Pro". Select Monthly or Annual billing.
            </Step>
            <Step n={3}>
              Complete payment via Stripe (credit/debit card, UPI, net banking).
            </Step>
            <Step n={4}>
              Your account upgrades instantly. All Pro features unlock
              immediately.
            </Step>
          </div>
        </SectionBlock>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: Shield,
    content: (
      <div>
        <SectionBlock title="App loads slowly">
          <ul className="list-disc list-inside space-y-1">
            <li>
              First load is slower due to the ICP canister cold start (5-15
              seconds after inactivity). Repeat visits are much faster.
            </li>
            <li>
              Add LekhyaAI to your home screen (PWA) for cached, near-instant
              loads.
            </li>
            <li>Check your internet connection speed.</li>
          </ul>
        </SectionBlock>
        <SectionBlock title="OCR scan extracts wrong data">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Use a higher resolution photo (300 DPI+). Blurry photos cause
              misreads.
            </li>
            <li>Ensure good lighting — avoid shadows over text.</li>
            <li>
              Configure Google Cloud Vision API key in Settings for much better
              accuracy.
            </li>
            <li>
              Review all 6 tabs and manually correct extracted fields before
              approving.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="AI Assistant not responding">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Go to Settings &gt; AI Engine and verify your Groq API key is
              saved (green badge).
            </li>
            <li>Click "Test Connection" to confirm the key works.</li>
            <li>
              Groq free tier has rate limits. Wait a minute and try again.
            </li>
            <li>
              Without a key, the assistant uses rule-based responses (no live
              AI).
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="Invoice not showing as Paid after payment">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Open the invoice and click the "Pay" (₹) button in the actions
              column.
            </li>
            <li>
              Fill in the amount, date, and payment mode. Click "Record
              Payment".
            </li>
            <li>
              The status should immediately change to "Paid" and the dashboard
              update.
            </li>
          </ul>
        </SectionBlock>
        <SectionBlock title="GSTIN validation error">
          <p>
            Indian GSTINs are exactly 15 characters: 2-digit state code +
            10-char PAN + 1 entity number + "Z" + 1 check digit. Example:
            27AAPFU0939F1ZV (Maharashtra).
          </p>
        </SectionBlock>
        <SectionBlock title="Contact Support">
          <p>
            For issues not covered here, use the Feedback option in the app or
            contact LekhyaAI support through the official channel. Include your
            business GSTIN and a description of the issue for faster resolution.
          </p>
        </SectionBlock>
      </div>
    ),
  },
];

// ─── Main Page ─────────────────────────────────────────────────────
export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const contentRef = useRef<HTMLDivElement>(null);

  const current = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  function handlePrint() {
    // Give the content area an id if not already present, then print
    const el = contentRef.current;
    if (el) {
      el.id = "manual-print-area";
    }
    printElementAsPdf("manual-print-area", "LekhyaAI User Manual");
  }

  return (
    <div className="flex h-full">
      {/* Sidebar TOC */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-muted/20 flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            User Manual
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">LekhyaAI v1.0</p>
        </div>
        <nav className="flex-1 py-2 px-2">
          {SECTIONS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              data-ocid={`manual.toc.item.${idx + 1}`}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors mb-0.5",
                activeSection === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button
            size="sm"
            className="w-full gap-2 bg-primary text-primary-foreground"
            onClick={handlePrint}
            data-ocid="manual.print.button"
          >
            <Download className="w-3.5 h-3.5" />
            Download / Print PDF
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          {/* Mobile section picker */}
          <div className="md:hidden mb-4">
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              data-ocid="manual.section.select"
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Header */}
          <div className="mb-6 pb-4 border-b border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <current.icon className="w-6 h-6 text-primary" />
                <h1 className="font-display text-2xl md:text-3xl text-foreground">
                  {current.title}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                LekhyaAI User Manual — AI-Powered GST Accounting for India
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-shrink-0 hidden md:flex"
              onClick={handlePrint}
              data-ocid="manual.download.button"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>

          {/* Section content */}
          <div className="prose-sm max-w-none">{current.content}</div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            {(() => {
              const idx = SECTIONS.findIndex((s) => s.id === activeSection);
              const prev = idx > 0 ? SECTIONS[idx - 1] : null;
              const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
              return (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!prev}
                    data-ocid="manual.prev.button"
                    onClick={() => prev && setActiveSection(prev.id)}
                    className="gap-2"
                  >
                    ← {prev?.title ?? ""}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {SECTIONS.findIndex((s) => s.id === activeSection) + 1} /{" "}
                    {SECTIONS.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!next}
                    data-ocid="manual.next.button"
                    onClick={() => next && setActiveSection(next.id)}
                    className="gap-2"
                  >
                    {next?.title ?? ""} →
                  </Button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          aside, nav, header, .md\\:hidden, button, [data-ocid="manual.print.button"], [data-ocid="manual.download.button"] {
            display: none !important;
          }
          body { background: white; color: black; }
          .prose-sm { font-size: 12pt; }
        }
      `}</style>
    </div>
  );
}
