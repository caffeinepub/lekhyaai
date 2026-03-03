import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Lock,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type LocalChartOfAccount,
  type LocalJournalEntry,
  type LocalJournalEntryLine,
  useAccounts,
  useCreateAccount,
  useCreateJournalEntry,
  useDeleteAccount,
  useJournalEntries,
  useLedger,
} from "../hooks/useQueries";
import { formatDate, formatINR } from "../utils/formatINR";

// ─── Account type config ─────────────────────────────────────────
const ACCOUNT_TYPE_CONFIG: Record<
  LocalChartOfAccount["accountType"],
  {
    label: string;
    badgeClass: string;
    textClass: string;
    bgClass: string;
    order: number;
  }
> = {
  Asset: {
    label: "Asset",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    textClass: "text-blue-700 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/10",
    order: 1,
  },
  Liability: {
    label: "Liability",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    textClass: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-900/10",
    order: 2,
  },
  Capital: {
    label: "Capital",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    textClass: "text-purple-700 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-900/10",
    order: 3,
  },
  Income: {
    label: "Income",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    textClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-900/10",
    order: 4,
  },
  Expense: {
    label: "Expense",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    textClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/10",
    order: 5,
  },
};

const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Capital",
  "Income",
  "Expense",
] as const;

// ─── Add Account Dialog ──────────────────────────────────────────
function AddAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createAccount = useCreateAccount();
  const [form, setForm] = useState({
    code: "",
    name: "",
    accountType: "" as LocalChartOfAccount["accountType"] | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Account code is required";
    if (!form.name.trim()) errs.name = "Account name is required";
    if (!form.accountType) errs.accountType = "Select an account type";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!form.accountType) return;
    try {
      await createAccount.mutateAsync({
        code: form.code,
        name: form.name,
        accountType: form.accountType,
      });
      toast.success(`Account "${form.name}" created`);
      setForm({ code: "", name: "", accountType: "" });
      onClose();
    } catch {
      toast.error("Failed to create account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-sm"
        data-ocid="ledger.add_account.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                data-ocid="ledger.account_code.input"
                placeholder="e.g. 6001"
                value={form.code}
                onChange={(e) => {
                  setForm((p) => ({ ...p, code: e.target.value }));
                  setErrors((p) => ({ ...p, code: "" }));
                }}
              />
              {errors.code && (
                <p className="text-destructive text-xs">{errors.code}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.accountType}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    accountType: v as LocalChartOfAccount["accountType"],
                  }));
                  setErrors((p) => ({ ...p, accountType: "" }));
                }}
              >
                <SelectTrigger data-ocid="ledger.account_type.select">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-destructive text-xs">{errors.accountType}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Account Name <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="ledger.account_name.input"
              placeholder="e.g. Travel Expenses"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: "" }));
              }}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              data-ocid="ledger.add_account.cancel_button"
              onClick={onClose}
              className="flex-1"
              disabled={createAccount.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="ledger.add_account.submit_button"
              disabled={createAccount.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {createAccount.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Create Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Journal Entry Dialog ───────────────────────────────────
function NewJournalEntryDialog({
  open,
  onClose,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: LocalChartOfAccount[];
}) {
  const createEntry = useCreateJournalEntry();
  const [narration, setNarration] = useState("");
  const [reference, setReference] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lines, setLines] = useState<
    { id: string; accountId: string; debit: string; credit: string }[]
  >([
    { id: "line_1", accountId: "", debit: "", credit: "" },
    { id: "line_2", accountId: "", debit: "", credit: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addLine() {
    setLines((p) => [
      ...p,
      { id: `line_${Date.now()}`, accountId: "", debit: "", credit: "" },
    ]);
  }

  function removeLine(idx: number) {
    setLines((p) => p.filter((_, i) => i !== idx));
  }

  function updateLine(
    idx: number,
    field: "accountId" | "debit" | "credit",
    val: string,
  ) {
    setLines((p) => {
      const next = [...p];
      next[idx] = { ...next[idx], [field]: val };
      // Clear opposite field when entering value
      if (field === "debit" && val) next[idx].credit = "";
      if (field === "credit" && val) next[idx].debit = "";
      return next;
    });
  }

  const totalDebit = lines.reduce(
    (s, l) => s + (Number.parseFloat(l.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (s, l) => s + (Number.parseFloat(l.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  function validate() {
    const errs: Record<string, string> = {};
    if (!narration.trim()) errs.narration = "Narration is required";
    if (!entryDate) errs.entryDate = "Date is required";
    if (lines.length < 2) errs.lines = "At least 2 lines required";
    lines.forEach((l, i) => {
      if (!l.accountId) errs[`line_account_${i}`] = "Select account";
      if (!l.debit && !l.credit)
        errs[`line_amount_${i}`] = "Enter debit or credit";
    });
    if (!isBalanced) errs.balance = "Debits must equal Credits";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const entryLines: LocalJournalEntryLine[] = lines.map((l) => ({
      accountId: l.accountId,
      debit: Math.round((Number.parseFloat(l.debit) || 0) * 100),
      credit: Math.round((Number.parseFloat(l.credit) || 0) * 100),
    }));
    try {
      await createEntry.mutateAsync({
        narration,
        reference,
        entryDate: new Date(entryDate).getTime(),
        lines: entryLines,
      });
      toast.success("Journal entry posted");
      setNarration("");
      setReference("");
      setLines([
        { id: "line_1", accountId: "", debit: "", credit: "" },
        { id: "line_2", accountId: "", debit: "", credit: "" },
      ]);
      onClose();
    } catch {
      toast.error("Failed to post entry");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="ledger.journal_entry.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            New Journal Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                data-ocid="ledger.je_date.input"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
              {errors.entryDate && (
                <p className="text-destructive text-xs">{errors.entryDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Reference No.</Label>
              <Input
                data-ocid="ledger.je_reference.input"
                placeholder="JV-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Narration <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="ledger.je_narration.input"
              placeholder="Being…"
              value={narration}
              onChange={(e) => {
                setNarration(e.target.value);
                setErrors((p) => ({ ...p, narration: "" }));
              }}
            />
            {errors.narration && (
              <p className="text-destructive text-xs">{errors.narration}</p>
            )}
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Entry Lines</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-ocid="ledger.je_add_line.button"
                onClick={addLine}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="w-3 h-3" /> Add Line
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-12 gap-0 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                <div className="col-span-6">Account</div>
                <div className="col-span-3 text-right">Dr. (₹)</div>
                <div className="col-span-3 text-right">Cr. (₹)</div>
              </div>
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-border last:border-0"
                  data-ocid={`ledger.je_line.${idx + 1}`}
                >
                  <div className="col-span-6">
                    <Select
                      value={line.accountId}
                      onValueChange={(v) => {
                        updateLine(idx, "accountId", v);
                        setErrors((p) => ({
                          ...p,
                          [`line_account_${idx}`]: "",
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => {
                          const typeAccounts = accounts.filter(
                            (a) => a.accountType === type,
                          );
                          if (typeAccounts.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {type}
                              </div>
                              {typeAccounts.map((a) => (
                                <SelectItem
                                  key={a.id}
                                  value={a.id}
                                  className="text-xs"
                                >
                                  {a.code} — {a.name}
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors[`line_account_${idx}`] && (
                      <p className="text-destructive text-xs mt-0.5">
                        {errors[`line_account_${idx}`]}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Input
                      className="h-8 text-xs text-right font-mono"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) => {
                        updateLine(idx, "debit", e.target.value);
                        setErrors((p) => ({
                          ...p,
                          [`line_amount_${idx}`]: "",
                        }));
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      className="h-8 text-xs text-right font-mono"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) => {
                        updateLine(idx, "credit", e.target.value);
                        setErrors((p) => ({
                          ...p,
                          [`line_amount_${idx}`]: "",
                        }));
                      }}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {lines.length > 2 && (
                      <button
                        type="button"
                        data-ocid={`ledger.je_remove_line.${idx + 1}`}
                        onClick={() => removeLine(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-0 px-3 py-2 bg-muted/20 border-t border-border">
                <div className="col-span-6 text-xs font-semibold text-foreground">
                  Total
                </div>
                <div
                  className={cn(
                    "col-span-3 text-right text-xs font-mono font-semibold",
                    isBalanced ? "text-success" : "text-destructive",
                  )}
                >
                  {totalDebit.toFixed(2)}
                </div>
                <div
                  className={cn(
                    "col-span-3 text-right text-xs font-mono font-semibold",
                    isBalanced ? "text-success" : "text-destructive",
                  )}
                >
                  {totalCredit.toFixed(2)}
                </div>
              </div>
            </div>
            {errors.balance && (
              <p className="text-destructive text-xs mt-1">{errors.balance}</p>
            )}
            {errors.lines && (
              <p className="text-destructive text-xs mt-1">{errors.lines}</p>
            )}
            {isBalanced && totalDebit > 0 && (
              <p className="text-success text-xs mt-1 flex items-center gap-1">
                ✓ Entry is balanced
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              data-ocid="ledger.je.cancel_button"
              onClick={onClose}
              className="flex-1"
              disabled={createEntry.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="ledger.je.submit_button"
              disabled={createEntry.isPending || !isBalanced}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {createEntry.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Post Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account List Panel ──────────────────────────────────────────
function AccountsPanel({
  accounts,
  selectedId,
  onSelect,
  onAddAccount,
}: {
  accounts: LocalChartOfAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddAccount: () => void;
}) {
  const deleteAccount = useDeleteAccount();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(["Asset", "Liability", "Income", "Expense", "Capital"]),
  );

  function toggleType(type: string) {
    setExpandedTypes((p) => {
      const next = new Set(p);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete account "${name}"? This will also remove related ledger entries.`,
      )
    )
      return;
    try {
      await deleteAccount.mutateAsync(id);
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  }

  const grouped = ACCOUNT_TYPES.map((type) => ({
    type,
    accounts: accounts
      .filter((a) => a.accountType === type)
      .sort((a, b) => a.code.localeCompare(b.code)),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Chart of Accounts
        </h2>
        <Button
          size="sm"
          variant="outline"
          data-ocid="ledger.add_account.open_modal_button"
          onClick={onAddAccount}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {grouped.map(({ type, accounts: typeAccounts }) => {
          const cfg =
            ACCOUNT_TYPE_CONFIG[type as LocalChartOfAccount["accountType"]];
          const isExpanded = expandedTypes.has(type);
          return (
            <div key={type}>
              <button
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  cfg.bgClass,
                  cfg.textClass,
                  "hover:opacity-80",
                )}
              >
                <span>
                  {type}s ({typeAccounts.length})
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {typeAccounts.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-muted-foreground italic">
                        No accounts
                      </p>
                    ) : (
                      typeAccounts.map((account, idx) => (
                        <motion.div
                          key={account.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          data-ocid={`ledger.account.item.${idx + 1}`}
                          onClick={() => onSelect(account.id)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors group",
                            selectedId === account.id
                              ? "bg-primary/10 border-r-2 border-primary"
                              : "hover:bg-muted/50 border-r-2 border-transparent",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-[10px] font-mono",
                                  cfg.textClass,
                                )}
                              >
                                {account.code}
                              </span>
                              {account.isSystem && (
                                <Lock className="w-2.5 h-2.5 text-muted-foreground/40" />
                              )}
                            </div>
                            <p className="text-xs text-foreground font-medium truncate">
                              {account.name}
                            </p>
                          </div>
                          {!account.isSystem && (
                            <button
                              type="button"
                              data-ocid={`ledger.account.delete_button.${idx + 1}`}
                              onClick={(e) =>
                                handleDelete(e, account.id, account.name)
                              }
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ledger View ─────────────────────────────────────────────────
function LedgerView({ accountId }: { accountId: string | null }) {
  const { data: ledger, isLoading } = useLedger(accountId);

  if (!accountId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-4 text-center p-8"
        data-ocid="ledger.view.empty_state"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary/60" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">
            Select an Account
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Choose an account from the left to view its ledger
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3" data-ocid="ledger.view.loading_state">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!ledger) {
    return (
      <div
        className="flex items-center justify-center h-full"
        data-ocid="ledger.view.error_state"
      >
        <p className="text-muted-foreground">Account not found</p>
      </div>
    );
  }

  const cfg =
    ACCOUNT_TYPE_CONFIG[
      ledger.account.accountType as LocalChartOfAccount["accountType"]
    ];
  const isPositiveBalance = ledger.closingBalance >= 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn("text-xs font-mono font-semibold", cfg.textClass)}
              >
                {ledger.account.code}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                  cfg.badgeClass,
                )}
              >
                {ledger.account.accountType}
              </span>
              {ledger.account.isSystem && (
                <Lock className="w-3 h-3 text-muted-foreground/50" />
              )}
            </div>
            <h3 className="font-display text-xl text-foreground">
              {ledger.account.name}
            </h3>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/30 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Total Dr.
            </p>
            <p className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatINR(BigInt(ledger.totalDebit))}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Total Cr.
            </p>
            <p className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
              {formatINR(BigInt(ledger.totalCredit))}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg px-3 py-2.5",
              isPositiveBalance
                ? "bg-green-50 dark:bg-green-900/10"
                : "bg-red-50 dark:bg-red-900/10",
            )}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              Closing Balance
            </p>
            <p
              className={cn(
                "font-mono text-sm font-bold",
                isPositiveBalance
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              )}
            >
              {ledger.closingBalance < 0 ? "(" : ""}
              {formatINR(BigInt(Math.abs(ledger.closingBalance)))}
              {ledger.closingBalance < 0 ? ")" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 overflow-auto">
        {ledger.lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <ScrollText className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              No transactions in this account yet
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Post a journal entry to see transactions here
            </p>
          </div>
        ) : (
          <table
            className="w-full text-sm"
            data-ocid="ledger.transactions.table"
          >
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Narration
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Ref. No.
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                  Dr. (₹)
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
                  Cr. (₹)
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                  Balance (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.lines.map((line, idx) => {
                const isDebit = line.debit > 0;
                const balancePositive = line.balance >= 0;
                return (
                  <tr
                    key={`${line.journalEntryId}-${idx}`}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`ledger.transactions.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(line.entryDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-[200px] truncate">
                      {line.narration}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">
                      {line.reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isDebit ? (
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {formatINR(BigInt(line.debit))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isDebit ? (
                        <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
                          {formatINR(BigInt(line.credit))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-mono text-xs font-bold",
                          balancePositive
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400",
                        )}
                      >
                        {line.balance < 0 ? "(" : ""}
                        {formatINR(BigInt(Math.abs(line.balance)))}
                        {line.balance < 0 ? ")" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Closing row */}
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border">
                <td
                  colSpan={3}
                  className="px-4 py-2.5 text-xs font-bold text-foreground"
                >
                  Closing Balance
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {formatINR(BigInt(ledger.totalDebit))}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-red-600 dark:text-red-400">
                  {formatINR(BigInt(ledger.totalCredit))}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">
                  <span
                    className={
                      isPositiveBalance
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }
                  >
                    {ledger.closingBalance < 0 ? "(" : ""}
                    {formatINR(BigInt(Math.abs(ledger.closingBalance)))}
                    {ledger.closingBalance < 0 ? ")" : ""}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Journal Entries View ────────────────────────────────────────
function JournalEntriesView({
  entries,
  accounts,
  onNewEntry,
}: {
  entries: LocalJournalEntry[];
  accounts: LocalChartOfAccount[];
  onNewEntry: () => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  function toggleExpand(id: string) {
    setExpandedIds((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...entries].sort((a, b) => b.entryDate - a.entryDate);

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 gap-4 text-center"
        data-ocid="ledger.journal_entries.empty_state"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ScrollText className="w-7 h-7 text-primary/60" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">
            No Journal Entries
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Post your first manual journal entry
          </p>
        </div>
        <Button
          onClick={onNewEntry}
          data-ocid="ledger.journal_entries.primary_button"
          className="bg-primary text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          New Journal Entry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4" data-ocid="ledger.journal_entries.list">
      {sorted.map((entry, idx) => {
        const isExpanded = expandedIds.has(entry.id);
        const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
            data-ocid={`ledger.journal_entry.item.${idx + 1}`}
          >
            <button
              type="button"
              onClick={() => toggleExpand(entry.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ScrollText className="w-4 h-4 text-primary/70" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.narration}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.entryDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {entry.reference && ` · ${entry.reference}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatINR(BigInt(totalDebit))}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator />
                  <div className="px-4 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left pb-2 font-medium">
                            Account
                          </th>
                          <th className="text-right pb-2 font-medium text-blue-600 dark:text-blue-400">
                            Dr. (₹)
                          </th>
                          <th className="text-right pb-2 font-medium text-red-600 dark:text-red-400">
                            Cr. (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line, li) => {
                          const acc = accountMap.get(line.accountId);
                          const cfg = acc
                            ? ACCOUNT_TYPE_CONFIG[acc.accountType]
                            : null;
                          return (
                            <tr
                              key={`${entry.id}-${li}`}
                              className="border-t border-border/50"
                            >
                              <td className="py-1.5 pr-4">
                                <div className="flex items-center gap-1.5">
                                  {acc && (
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono",
                                        cfg?.textClass,
                                      )}
                                    >
                                      {acc.code}
                                    </span>
                                  )}
                                  <span className="text-foreground font-medium">
                                    {acc?.name ?? line.accountId}
                                  </span>
                                </div>
                              </td>
                              <td className="py-1.5 text-right font-mono">
                                {line.debit > 0 ? (
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {formatINR(BigInt(line.debit))}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 text-right font-mono">
                                {line.credit > 0 ? (
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    {formatINR(BigInt(line.credit))}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/30">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function LedgerPage() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: journalEntries = [] } = useJournalEntries();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ledger" | "journal">("ledger");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary/80" />
            Double-Entry Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            CA-grade accounting · {accounts.length} accounts ·{" "}
            {journalEntries.length} journal entries
          </p>
        </div>
        <Button
          data-ocid="ledger.new_journal_entry.open_modal_button"
          onClick={() => setNewEntryOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Entry</span>
        </Button>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden border-b border-border">
        <div className="flex">
          <button
            type="button"
            data-ocid="ledger.accounts.tab"
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              activeTab === "ledger"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground",
            )}
          >
            Ledger
          </button>
          <button
            type="button"
            data-ocid="ledger.journal.tab"
            onClick={() => setActiveTab("journal")}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              activeTab === "journal"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground",
            )}
          >
            Journal Entries
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: two-column layout */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left: Chart of Accounts */}
          <div className="w-72 flex-shrink-0 border-r border-border bg-card/30 overflow-hidden flex flex-col">
            {accountsLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <AccountsPanel
                accounts={accounts}
                selectedId={selectedAccountId}
                onSelect={setSelectedAccountId}
                onAddAccount={() => setAddAccountOpen(true)}
              />
            )}
          </div>

          {/* Right: Ledger / Journal tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "ledger" | "journal")}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="border-b border-border px-6 pt-3">
                <TabsList className="h-9">
                  <TabsTrigger
                    value="ledger"
                    data-ocid="ledger.ledger_view.tab"
                    className="text-xs"
                  >
                    Account Ledger
                  </TabsTrigger>
                  <TabsTrigger
                    value="journal"
                    data-ocid="ledger.journal_view.tab"
                    className="text-xs"
                  >
                    Journal Entries
                    {journalEntries.length > 0 && (
                      <span className="ml-1.5 bg-primary/15 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        {journalEntries.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent
                value="ledger"
                className="flex-1 overflow-hidden m-0"
              >
                <LedgerView accountId={selectedAccountId} />
              </TabsContent>
              <TabsContent value="journal" className="flex-1 overflow-auto m-0">
                <JournalEntriesView
                  entries={journalEntries}
                  accounts={accounts}
                  onNewEntry={() => setNewEntryOpen(true)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile: single panel based on active tab */}
        <div className="flex flex-col flex-1 overflow-hidden md:hidden">
          {activeTab === "ledger" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Account selector for mobile */}
              {!selectedAccountId ? (
                <div className="flex-1 overflow-auto">
                  <AccountsPanel
                    accounts={accounts}
                    selectedId={selectedAccountId}
                    onSelect={(id) => {
                      setSelectedAccountId(id);
                    }}
                    onAddAccount={() => setAddAccountOpen(true)}
                  />
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 py-2 border-b border-border">
                    <button
                      type="button"
                      data-ocid="ledger.back.button"
                      onClick={() => setSelectedAccountId(null)}
                      className="text-primary text-sm flex items-center gap-1 hover:underline"
                    >
                      ← Back to accounts
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <LedgerView accountId={selectedAccountId} />
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "journal" && (
            <div className="flex-1 overflow-auto">
              <JournalEntriesView
                entries={journalEntries}
                accounts={accounts}
                onNewEntry={() => setNewEntryOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddAccountDialog
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
      />
      <NewJournalEntryDialog
        open={newEntryOpen}
        onClose={() => setNewEntryOpen(false)}
        accounts={accounts}
      />
    </div>
  );
}
