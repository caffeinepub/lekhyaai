import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { formatINRNumber } from "../utils/formatINR";

// ─── Types ──────────────────────────────────────────────────────
type AccountType = "Current" | "Savings" | "CreditCard" | "Overdraft";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType: AccountType;
  openingBalance: number; // in rupees
  openingDate: string;
  createdAt: number;
}

interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  reconciled: boolean;
  createdAt: number;
}

// ─── localStorage helpers ────────────────────────────────────────
function getBankAccounts(businessId: string): BankAccount[] {
  try {
    return JSON.parse(
      localStorage.getItem(`lekhya_bank_accounts_${businessId}`) || "[]",
    ) as BankAccount[];
  } catch {
    return [];
  }
}

function saveBankAccounts(businessId: string, accounts: BankAccount[]) {
  localStorage.setItem(
    `lekhya_bank_accounts_${businessId}`,
    JSON.stringify(accounts),
  );
}

function getBankTransactions(bankAccountId: string): BankTransaction[] {
  try {
    return JSON.parse(
      localStorage.getItem(`lekhya_bank_transactions_${bankAccountId}`) || "[]",
    ) as BankTransaction[];
  } catch {
    return [];
  }
}

function saveBankTransactions(bankAccountId: string, txns: BankTransaction[]) {
  localStorage.setItem(
    `lekhya_bank_transactions_${bankAccountId}`,
    JSON.stringify(txns),
  );
}

// ─── Helpers ─────────────────────────────────────────────────────
function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return "•".repeat(num.length - 4) + num.slice(-4);
}

const ACCOUNT_TYPE_BADGE: Record<
  AccountType,
  { label: string; className: string }
> = {
  Current: {
    label: "Current",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  },
  Savings: {
    label: "Savings",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  },
  CreditCard: {
    label: "Credit Card",
    className:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  },
  Overdraft: {
    label: "Overdraft",
    className:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

// ─── Add Bank Account Dialog ─────────────────────────────────────
function AddBankAccountDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (account: Omit<BankAccount, "id" | "createdAt">) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    accountType: "Current" as AccountType,
    openingBalance: "",
    openingDate: new Date().toISOString().split("T")[0],
  });

  function handleSave() {
    if (!form.bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }
    if (!form.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onSave({
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode.toUpperCase(),
        branch: form.branch,
        accountType: form.accountType,
        openingBalance: Number.parseFloat(form.openingBalance) || 0,
        openingDate: form.openingDate,
      });
      setForm({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branch: "",
        accountType: "Current",
        openingBalance: "",
        openingDate: new Date().toISOString().split("T")[0],
      });
      setSaving(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="bank_accounts.add_account.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Add Bank Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>
                Bank Name <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="bank_accounts.bank_name.input"
                placeholder="State Bank of India"
                value={form.bankName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankName: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="bank_accounts.account_number.input"
                placeholder="1234567890"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, accountNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code</Label>
              <Input
                data-ocid="bank_accounts.ifsc_code.input"
                placeholder="SBIN0001234"
                value={form.ifscCode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    ifscCode: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Input
                data-ocid="bank_accounts.branch.input"
                placeholder="Main Branch"
                value={form.branch}
                onChange={(e) =>
                  setForm((p) => ({ ...p, branch: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <Select
                value={form.accountType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, accountType: v as AccountType }))
                }
              >
                <SelectTrigger data-ocid="bank_accounts.account_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="CreditCard">Credit Card</SelectItem>
                  <SelectItem value="Overdraft">Overdraft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opening Date</Label>
              <Input
                type="date"
                data-ocid="bank_accounts.opening_date.input"
                value={form.openingDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openingDate: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Opening Balance (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                data-ocid="bank_accounts.opening_balance.input"
                placeholder="0.00"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openingBalance: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            data-ocid="bank_accounts.add_account.cancel_button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            data-ocid="bank_accounts.add_account.submit_button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bank Statement View ─────────────────────────────────────────
function BankStatementView({
  account,
  onBack,
  onRefresh,
}: {
  account: BankAccount;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [txns, setTxns] = useState<BankTransaction[]>(() =>
    getBankTransactions(account.id),
  );
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "credit" as "debit" | "credit",
    amount: "",
  });

  function toggleReconcile(txnId: string) {
    const updated = txns.map((t) =>
      t.id === txnId ? { ...t, reconciled: !t.reconciled } : t,
    );
    setTxns(updated);
    saveBankTransactions(account.id, updated);
    onRefresh();
  }

  function addTransaction() {
    if (!txnForm.description.trim()) {
      toast.error("Description is required");
      return;
    }
    const amount = Number.parseFloat(txnForm.amount) || 0;
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const newTxn: BankTransaction = {
      id: `btxn_${Date.now()}`,
      bankAccountId: account.id,
      date: txnForm.date,
      description: txnForm.description,
      debit: txnForm.type === "debit" ? amount : 0,
      credit: txnForm.type === "credit" ? amount : 0,
      reconciled: false,
      createdAt: Date.now(),
    };
    const updated = [...txns, newTxn].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    setTxns(updated);
    saveBankTransactions(account.id, updated);
    setTxnForm({
      date: new Date().toISOString().split("T")[0],
      description: "",
      type: "credit",
      amount: "",
    });
    setAddTxnOpen(false);
    toast.success("Transaction added");
    onRefresh();
  }

  // Calculate running balance
  const withBalance: (BankTransaction & { balance: number })[] = [];
  {
    let runBalance = account.openingBalance;
    for (const txn of txns) {
      runBalance = runBalance + txn.credit - txn.debit;
      withBalance.push({ ...txn, balance: runBalance });
    }
  }

  const bookBalance =
    account.openingBalance + txns.reduce((s, t) => s + t.credit - t.debit, 0);
  const reconciledBalance =
    account.openingBalance +
    txns
      .filter((t) => t.reconciled)
      .reduce((s, t) => s + t.credit - t.debit, 0);
  const unreconciledCount = txns.filter((t) => !t.reconciled).length;
  const difference = bookBalance - reconciledBalance;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-border bg-card/50">
        <Button
          variant="ghost"
          size="sm"
          data-ocid="bank_accounts.back.button"
          onClick={onBack}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h2 className="font-display text-lg text-foreground">
            {account.bankName}
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            {maskAccountNumber(account.accountNumber)} ·{" "}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5",
                ACCOUNT_TYPE_BADGE[account.accountType].className,
              )}
            >
              {ACCOUNT_TYPE_BADGE[account.accountType].label}
            </Badge>
          </p>
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            data-ocid="bank_accounts.add_transaction.open_modal_button"
            onClick={() => setAddTxnOpen(true)}
            className="bg-primary text-primary-foreground gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Reconciliation Summary */}
      <div className="px-4 md:px-6 py-4 bg-muted/20 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Reconciliation Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Book Balance
            </p>
            <p className="font-mono text-sm font-bold text-foreground">
              ₹ {formatINRNumber(bookBalance)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Reconciled Balance
            </p>
            <p className="font-mono text-sm font-bold text-success">
              ₹ {formatINRNumber(reconciledBalance)}
            </p>
          </div>
          <div
            className={cn(
              "bg-card border rounded-lg px-3 py-2.5",
              unreconciledCount > 0 ? "border-warning/40" : "border-border",
            )}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Unreconciled
            </p>
            <p
              className={cn(
                "font-mono text-sm font-bold",
                unreconciledCount > 0 ? "text-warning" : "text-foreground",
              )}
            >
              {unreconciledCount} txns
            </p>
          </div>
          <div
            className={cn(
              "bg-card border rounded-lg px-3 py-2.5",
              Math.abs(difference) > 0.01
                ? "border-destructive/40"
                : "border-border",
            )}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Difference
            </p>
            <p
              className={cn(
                "font-mono text-sm font-bold",
                Math.abs(difference) > 0.01
                  ? "text-destructive"
                  : "text-success",
              )}
            >
              {Math.abs(difference) < 0.01 ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                </span>
              ) : (
                `₹ ${formatINRNumber(Math.abs(difference))}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto">
        {txns.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            data-ocid="bank_accounts.transactions.empty_state"
          >
            <RefreshCw className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No transactions yet</p>
            <Button
              size="sm"
              variant="outline"
              data-ocid="bank_accounts.add_first_transaction.button"
              onClick={() => setAddTxnOpen(true)}
            >
              Add first transaction
            </Button>
          </div>
        ) : (
          <Table data-ocid="bank_accounts.transactions.table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right text-destructive/70">
                  Debit (₹)
                </TableHead>
                <TableHead className="text-xs text-right text-success/80">
                  Credit (₹)
                </TableHead>
                <TableHead className="text-xs text-right">
                  Balance (₹)
                </TableHead>
                <TableHead className="text-xs text-center">
                  Reconciled
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withBalance.map((txn, idx) => (
                <TableRow
                  key={txn.id}
                  data-ocid={`bank_accounts.transactions.item.${idx + 1}`}
                  className={cn(txn.reconciled && "bg-success/5")}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(txn.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {txn.debit > 0 ? (
                      <span className="text-destructive font-semibold">
                        {formatINRNumber(txn.debit)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {txn.credit > 0 ? (
                      <span className="text-success font-semibold">
                        {formatINRNumber(txn.credit)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    <span
                      className={
                        txn.balance >= 0
                          ? "text-foreground"
                          : "text-destructive"
                      }
                    >
                      {txn.balance < 0 ? "(" : ""}
                      {formatINRNumber(Math.abs(txn.balance))}
                      {txn.balance < 0 ? ")" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      data-ocid={`bank_accounts.reconcile.checkbox.${idx + 1}`}
                      checked={txn.reconciled}
                      onCheckedChange={() => toggleReconcile(txn.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog
        open={addTxnOpen}
        onOpenChange={(v) => !v && setAddTxnOpen(false)}
      >
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="bank_accounts.add_transaction.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Add Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                data-ocid="bank_accounts.txn_date.input"
                value={txnForm.date}
                onChange={(e) =>
                  setTxnForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="bank_accounts.txn_description.input"
                placeholder="NEFT/RTGS/UPI reference"
                value={txnForm.description}
                onChange={(e) =>
                  setTxnForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={txnForm.type}
                  onValueChange={(v) =>
                    setTxnForm((p) => ({
                      ...p,
                      type: v as "debit" | "credit",
                    }))
                  }
                >
                  <SelectTrigger data-ocid="bank_accounts.txn_type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Inflow)</SelectItem>
                    <SelectItem value="debit">Debit (Outflow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Amount (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  data-ocid="bank_accounts.txn_amount.input"
                  placeholder="0.00"
                  value={txnForm.amount}
                  onChange={(e) =>
                    setTxnForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              data-ocid="bank_accounts.add_transaction.cancel_button"
              onClick={() => setAddTxnOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="bank_accounts.add_transaction.submit_button"
              onClick={addTransaction}
              className="bg-primary text-primary-foreground"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function BankAccountsPage() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id.toString() ?? "";

  const [accounts, setAccounts] = useState<BankAccount[]>(() =>
    activeBusiness ? getBankAccounts(activeBusiness.id.toString()) : [],
  );
  const [addOpen, setAddOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );

  function handleSaveAccount(data: Omit<BankAccount, "id" | "createdAt">) {
    const account: BankAccount = {
      ...data,
      id: `bank_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [...accounts, account];
    setAccounts(updated);
    saveBankAccounts(businessId, updated);
    setAddOpen(false);
    toast.success(`${data.bankName} account added`);
  }

  function handleDeleteAccount(id: string) {
    if (!confirm("Delete this bank account? All transactions will be removed."))
      return;
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    saveBankAccounts(businessId, updated);
    localStorage.removeItem(`lekhya_bank_transactions_${id}`);
    toast.success("Account removed");
  }

  function handleRefresh() {
    setAccounts(getBankAccounts(businessId));
  }

  if (selectedAccount) {
    return (
      <BankStatementView
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onRefresh={handleRefresh}
      />
    );
  }

  const totalBalance = accounts.reduce((s, a) => {
    const txns = getBankTransactions(a.id);
    const balance =
      a.openingBalance + txns.reduce((t, tx) => t + tx.credit - tx.debit, 0);
    return s + balance;
  }, 0);

  const totalUnreconciled = accounts.reduce((s, a) => {
    const txns = getBankTransactions(a.id);
    return s + txns.filter((t) => !t.reconciled).length;
  }, 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2"
          >
            <Banknote className="w-7 h-7 text-primary/80" />
            Bank Accounts
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeBusiness?.name} · {accounts.length} account
            {accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="bank_accounts.add_account.open_modal_button"
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Bar */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">
              Total Bank Balance
            </p>
            <p className="text-xl font-bold font-mono text-primary">
              ₹ {formatINRNumber(totalBalance)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Accounts</p>
            <p className="text-xl font-bold text-foreground">
              {accounts.length}
            </p>
          </div>
          <div
            className={cn(
              "bg-card border rounded-xl px-4 py-3 col-span-2 sm:col-span-1",
              totalUnreconciled > 0 ? "border-warning/40" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">
              Unreconciled Transactions
            </p>
            <p
              className={cn(
                "text-xl font-bold",
                totalUnreconciled > 0 ? "text-warning" : "text-success",
              )}
            >
              {totalUnreconciled > 0 ? (
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5" />
                  {totalUnreconciled}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" />
                  All Clear
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          data-ocid="bank_accounts.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Banknote className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground">
              No Bank Accounts Yet
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Add your business bank account to start reconciling
            </p>
          </div>
          <Button
            data-ocid="bank_accounts.add_first.button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Account
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, idx) => {
            const txns = getBankTransactions(account.id);
            const currentBalance =
              account.openingBalance +
              txns.reduce((s, t) => s + t.credit - t.debit, 0);
            const unrec = txns.filter((t) => !t.reconciled).length;

            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                data-ocid={`bank_accounts.account.card.${idx + 1}`}
                className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          ACCOUNT_TYPE_BADGE[account.accountType].className,
                        )}
                      >
                        {ACCOUNT_TYPE_BADGE[account.accountType].label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground text-base">
                      {account.bankName}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {maskAccountNumber(account.accountNumber)}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid={`bank_accounts.delete_account.delete_button.${idx + 1}`}
                    onClick={() => handleDeleteAccount(account.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {account.ifscCode && (
                  <p className="text-xs text-muted-foreground mb-0.5">
                    IFSC: <span className="font-mono">{account.ifscCode}</span>
                  </p>
                )}
                {account.branch && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Branch: {account.branch}
                  </p>
                )}

                <Separator className="mb-3" />

                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Balance
                    </p>
                    <p
                      className={cn(
                        "text-xl font-bold font-mono",
                        currentBalance >= 0
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      ₹ {formatINRNumber(currentBalance)}
                    </p>
                  </div>
                  {unrec > 0 && (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {unrec} unreconciled
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  data-ocid={`bank_accounts.view_transactions.button.${idx + 1}`}
                  onClick={() => setSelectedAccount(account)}
                  className="w-full"
                >
                  View Transactions & Reconcile
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddBankAccountDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
