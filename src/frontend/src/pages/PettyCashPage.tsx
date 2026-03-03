import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Plus, RefreshCw, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { formatINRNumber } from "../utils/formatINR";

// ─── Types ──────────────────────────────────────────────────────
type TxnType = "Receipt" | "Payment";
type TxnCategory =
  | "Office Supplies"
  | "Travel"
  | "Food"
  | "Repairs"
  | "Miscellaneous";

interface PettyCashAccount {
  id: string;
  businessId: string;
  custodian: string;
  openingBalance: number;
  createdAt: number;
}

interface PettyCashTransaction {
  id: string;
  accountId: string;
  date: string;
  voucherNo: string;
  description: string;
  category: TxnCategory;
  amount: number;
  type: TxnType;
  approvedBy: string;
  createdAt: number;
}

// ─── localStorage helpers ────────────────────────────────────────
function getPettyCashAccount(businessId: string): PettyCashAccount | null {
  try {
    const raw = localStorage.getItem(`lekhya_petty_cash_${businessId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PettyCashAccount;
  } catch {
    return null;
  }
}

function savePettyCashAccount(account: PettyCashAccount) {
  localStorage.setItem(
    `lekhya_petty_cash_${account.businessId}`,
    JSON.stringify(account),
  );
}

function getPettyCashTxns(accountId: string): PettyCashTransaction[] {
  try {
    const raw = localStorage.getItem(`lekhya_petty_cash_txns_${accountId}`);
    if (!raw) return [];
    return JSON.parse(raw) as PettyCashTransaction[];
  } catch {
    return [];
  }
}

function savePettyCashTxns(accountId: string, txns: PettyCashTransaction[]) {
  localStorage.setItem(
    `lekhya_petty_cash_txns_${accountId}`,
    JSON.stringify(txns),
  );
}

// ─── Category Badge ──────────────────────────────────────────────
const CATEGORY_STYLE: Record<TxnCategory, string> = {
  "Office Supplies":
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  Travel:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  Food: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  Repairs:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  Miscellaneous:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
};

const CATEGORIES: TxnCategory[] = [
  "Office Supplies",
  "Travel",
  "Food",
  "Repairs",
  "Miscellaneous",
];

// ─── Setup Modal ─────────────────────────────────────────────────
function SetupPettyCashDialog({
  businessId,
  onSetup,
}: {
  businessId: string;
  onSetup: (account: PettyCashAccount) => void;
}) {
  const [form, setForm] = useState({
    custodian: "",
    openingBalance: "",
  });

  function handleSetup() {
    if (!form.custodian.trim()) {
      toast.error("Custodian name is required");
      return;
    }
    const account: PettyCashAccount = {
      id: `pc_${Date.now()}`,
      businessId,
      custodian: form.custodian,
      openingBalance: Number.parseFloat(form.openingBalance) || 0,
      createdAt: Date.now(),
    };
    savePettyCashAccount(account);
    onSetup(account);
    toast.success("Petty cash account created");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-6 max-w-sm mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Wallet className="w-8 h-8 text-primary/60" />
      </div>
      <div className="text-center">
        <h3 className="font-display text-xl text-foreground">
          Setup Petty Cash
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Create a petty cash account for your business
        </p>
      </div>
      <div className="w-full space-y-4">
        <div className="space-y-1.5">
          <Label>
            Custodian Name <span className="text-destructive">*</span>
          </Label>
          <Input
            data-ocid="petty_cash.custodian.input"
            placeholder="e.g. Ravi Kumar"
            value={form.custodian}
            onChange={(e) =>
              setForm((p) => ({ ...p, custodian: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Opening Balance (₹)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            data-ocid="petty_cash.opening_balance.input"
            placeholder="5000.00"
            value={form.openingBalance}
            onChange={(e) =>
              setForm((p) => ({ ...p, openingBalance: e.target.value }))
            }
          />
        </div>
        <Button
          data-ocid="petty_cash.setup.submit_button"
          onClick={handleSetup}
          className="w-full bg-primary text-primary-foreground"
        >
          Create Petty Cash Account
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Add Transaction Dialog ──────────────────────────────────────
function AddTxnDialog({
  open,
  onClose,
  onAdd,
  nextVoucherNo,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (
    txn: Omit<PettyCashTransaction, "id" | "accountId" | "createdAt">,
  ) => void;
  nextVoucherNo: string;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    voucherNo: nextVoucherNo,
    description: "",
    category: "Miscellaneous" as TxnCategory,
    amount: "",
    type: "Payment" as TxnType,
    approvedBy: "",
  });

  function handleSave() {
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    const amount = Number.parseFloat(form.amount) || 0;
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onAdd({
        date: form.date,
        voucherNo: form.voucherNo,
        description: form.description,
        category: form.category,
        amount,
        type: form.type,
        approvedBy: form.approvedBy,
      });
      setSaving(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="petty_cash.add_txn.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Add Petty Cash Transaction
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                data-ocid="petty_cash.txn_date.input"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Voucher No.</Label>
              <Input
                data-ocid="petty_cash.voucher_no.input"
                value={form.voucherNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, voucherNo: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="petty_cash.txn_description.input"
              placeholder="e.g. Stationery purchase"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, category: v as TxnCategory }))
                }
              >
                <SelectTrigger data-ocid="petty_cash.category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as TxnType }))
                }
              >
                <SelectTrigger data-ocid="petty_cash.txn_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payment">Payment (Out)</SelectItem>
                  <SelectItem value="Receipt">Receipt (In)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                data-ocid="petty_cash.amount.input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Approved By</Label>
              <Input
                data-ocid="petty_cash.approved_by.input"
                placeholder="Manager name"
                value={form.approvedBy}
                onChange={(e) =>
                  setForm((p) => ({ ...p, approvedBy: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            data-ocid="petty_cash.add_txn.cancel_button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            data-ocid="petty_cash.add_txn.submit_button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Replenish Dialog ────────────────────────────────────────────
function ReplenishDialog({
  open,
  onClose,
  onReplenish,
}: {
  open: boolean;
  onClose: () => void;
  onReplenish: (amount: number, narration: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");

  function handle() {
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    onReplenish(amt, narration || "Petty cash replenishment");
    setAmount("");
    setNarration("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-sm"
        data-ocid="petty_cash.replenish.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Replenish Petty Cash
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              data-ocid="petty_cash.replenish_amount.input"
              placeholder="5000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Narration</Label>
            <Textarea
              data-ocid="petty_cash.replenish_narration.textarea"
              placeholder="Replenishment from main cash"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            data-ocid="petty_cash.replenish.cancel_button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            data-ocid="petty_cash.replenish.confirm_button"
            onClick={handle}
            className="bg-primary text-primary-foreground"
          >
            Replenish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function PettyCashPage() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id.toString() ?? "";

  const [account, setAccount] = useState<PettyCashAccount | null>(() =>
    activeBusiness ? getPettyCashAccount(activeBusiness.id.toString()) : null,
  );
  const [txns, setTxns] = useState<PettyCashTransaction[]>(() =>
    account ? getPettyCashTxns(account.id) : [],
  );
  const [addOpen, setAddOpen] = useState(false);
  const [replenishOpen, setReplenishOpen] = useState(false);

  function handleSetup(acc: PettyCashAccount) {
    setAccount(acc);
    setTxns([]);
  }

  function handleAddTxn(
    data: Omit<PettyCashTransaction, "id" | "accountId" | "createdAt">,
  ) {
    if (!account) return;
    const newTxn: PettyCashTransaction = {
      ...data,
      id: `pctxn_${Date.now()}`,
      accountId: account.id,
      createdAt: Date.now(),
    };
    const updated = [...txns, newTxn].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    setTxns(updated);
    savePettyCashTxns(account.id, updated);
    setAddOpen(false);
    toast.success("Transaction added");
  }

  function handleReplenish(amount: number, narration: string) {
    if (!account) return;
    const count = txns.length + 1;
    const newTxn: PettyCashTransaction = {
      id: `pctxn_${Date.now()}`,
      accountId: account.id,
      date: new Date().toISOString().split("T")[0],
      voucherNo: `PCR-${String(count).padStart(3, "0")}`,
      description: narration,
      category: "Miscellaneous",
      amount,
      type: "Receipt",
      approvedBy: "",
      createdAt: Date.now(),
    };
    const updated = [...txns, newTxn];
    setTxns(updated);
    savePettyCashTxns(account.id, updated);
    toast.success(`₹ ${formatINRNumber(amount)} replenished`);
  }

  if (!account) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary/80" />
            Petty Cash
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage petty cash for {activeBusiness?.name}
          </p>
        </div>
        <SetupPettyCashDialog businessId={businessId} onSetup={handleSetup} />
      </div>
    );
  }

  // Compute running balance
  const withBalance: (PettyCashTransaction & { balance: number })[] = [];
  {
    let runBalance = account.openingBalance;
    for (const txn of txns) {
      runBalance =
        txn.type === "Receipt"
          ? runBalance + txn.amount
          : runBalance - txn.amount;
      withBalance.push({ ...txn, balance: runBalance });
    }
  }

  const currentBalance =
    account.openingBalance +
    txns.reduce((s, t) => s + (t.type === "Receipt" ? t.amount : -t.amount), 0);

  const nextVoucherNo = `PCV-${String(txns.length + 1).padStart(3, "0")}`;

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
            <Wallet className="w-7 h-7 text-primary/80" />
            Petty Cash
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Custodian: {account.custodian}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="petty_cash.replenish.open_modal_button"
            onClick={() => setReplenishOpen(true)}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replenish
          </Button>
          <Button
            size="sm"
            data-ocid="petty_cash.add_txn.open_modal_button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Account Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card border border-border rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <p
            className={cn(
              "text-2xl font-bold font-mono",
              currentBalance >= 500
                ? "text-success"
                : currentBalance > 0
                  ? "text-warning"
                  : "text-destructive",
            )}
          >
            ₹ {formatINRNumber(currentBalance)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Opening Balance</p>
          <p className="text-lg font-bold font-mono text-foreground">
            ₹ {formatINRNumber(account.openingBalance)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Transactions</p>
          <p className="text-lg font-bold text-foreground">{txns.length}</p>
        </div>
      </motion.div>

      {/* Low balance warning */}
      {currentBalance < 500 && currentBalance > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-sm text-warning">
          <Wallet className="w-4 h-4 flex-shrink-0" />
          <span>Petty cash balance is low. Consider replenishing.</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-warning/30 text-warning hover:bg-warning/10"
            onClick={() => setReplenishOpen(true)}
          >
            Replenish
          </Button>
        </div>
      )}

      {/* Transaction Log */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="font-semibold text-foreground">Transaction Log</h3>
        </div>
        {txns.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3 text-center"
            data-ocid="petty_cash.transactions.empty_state"
          >
            <Wallet className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No transactions yet</p>
            <Button
              size="sm"
              variant="outline"
              data-ocid="petty_cash.add_first_txn.button"
              onClick={() => setAddOpen(true)}
            >
              Add first transaction
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="petty_cash.transactions.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Voucher No.</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right text-success/80">
                    Receipt (+)
                  </TableHead>
                  <TableHead className="text-xs text-right text-destructive/70">
                    Payment (-)
                  </TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">
                    Approved By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withBalance.map((txn, idx) => (
                  <TableRow
                    key={txn.id}
                    data-ocid={`petty_cash.transactions.item.${idx + 1}`}
                  >
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {txn.voucherNo}
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate">
                      {txn.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", CATEGORY_STYLE[txn.category])}
                      >
                        {txn.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {txn.type === "Receipt" ? (
                        <span className="text-success font-semibold">
                          {formatINRNumber(txn.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {txn.type === "Payment" ? (
                        <span className="text-destructive font-semibold">
                          {formatINRNumber(txn.amount)}
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
                        {formatINRNumber(txn.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                      {txn.approvedBy || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddTxnDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddTxn}
        nextVoucherNo={nextVoucherNo}
      />
      <ReplenishDialog
        open={replenishOpen}
        onClose={() => setReplenishOpen(false)}
        onReplenish={handleReplenish}
      />
    </div>
  );
}
