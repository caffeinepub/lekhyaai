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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Loader2, Plus, Receipt, Search, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
  useVendors,
} from "../hooks/useQueries";
import {
  dateStringToNs,
  formatDate,
  formatDateInput,
  formatINR,
} from "../utils/formatINR";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Travel",
  "Office Supplies",
  "Professional Fees",
  "Marketing",
  "Other",
];

interface ExpenseFormData {
  vendorId: string;
  category: string;
  amount: string;
  gstAmount: string;
  expenseDate: string;
  description: string;
}

const EMPTY_EXPENSE: ExpenseFormData = {
  vendorId: "",
  category: "",
  amount: "",
  gstAmount: "0",
  expenseDate: new Date().toISOString().split("T")[0],
  description: "",
};

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Expense | null;
  vendors: Array<{ id: bigint; name: string }>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  title: string;
}

function ExpenseModal({
  open,
  onClose,
  initialData,
  vendors,
  onSubmit,
  title,
}: ExpenseModalProps) {
  const [form, setForm] = useState<ExpenseFormData>(EMPTY_EXPENSE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          vendorId: initialData.vendorId?.toString() ?? "",
          category: initialData.category,
          amount: (Number(initialData.amount) / 100).toString(),
          gstAmount: (Number(initialData.gstAmount) / 100).toString(),
          expenseDate: formatDateInput(initialData.expenseDate),
          description: initialData.description,
        });
      } else {
        setForm(EMPTY_EXPENSE);
      }
      setErrors({});
    }
  }, [open, initialData]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = "Category is required";
    if (!form.amount || Number.parseFloat(form.amount) <= 0)
      errs.amount = "Valid amount required";
    if (!form.expenseDate) errs.expenseDate = "Date is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="expense.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, category: v }));
                  setErrors((p) => ({ ...p, category: "" }));
                }}
              >
                <SelectTrigger data-ocid="expense.category_select">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-xs">{errors.category}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                data-ocid="expense.date_input"
                value={form.expenseDate}
                onChange={(e) => {
                  setForm((p) => ({ ...p, expenseDate: e.target.value }));
                  setErrors((p) => ({ ...p, expenseDate: "" }));
                }}
              />
              {errors.expenseDate && (
                <p className="text-destructive text-xs">{errors.expenseDate}</p>
              )}
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
                data-ocid="expense.amount_input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => {
                  setForm((p) => ({ ...p, amount: e.target.value }));
                  setErrors((p) => ({ ...p, amount: "" }));
                }}
              />
              {errors.amount && (
                <p className="text-destructive text-xs">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>GST Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.gstAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gstAmount: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Vendor (optional)</Label>
            <Select
              value={form.vendorId}
              onValueChange={(v) => setForm((p) => ({ ...p, vendorId: v }))}
            >
              <SelectTrigger data-ocid="expense.vendor_select">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id.toString()} value={v.id.toString()}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              data-ocid="expense.description_input"
              rows={2}
              placeholder="Brief description of the expense"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="expense.cancel_button"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="expense.submit_button"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving…" : "Save Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: vendors = [] } = useVendors();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const vendorMap = new Map(vendors.map((v) => [v.id.toString(), v.name]));

  const filtered = expenses.filter(
    (e) =>
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()),
  );

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0n);
  const totalGst = filtered.reduce((sum, e) => sum + e.gstAmount, 0n);

  async function handleCreate(data: ExpenseFormData) {
    try {
      await createExpense.mutateAsync({
        vendorId:
          data.vendorId && data.vendorId !== "none"
            ? BigInt(data.vendorId)
            : null,
        category: data.category,
        amount: BigInt(Math.round(Number.parseFloat(data.amount || "0") * 100)),
        gstAmount: BigInt(
          Math.round(Number.parseFloat(data.gstAmount || "0") * 100),
        ),
        expenseDate: dateStringToNs(data.expenseDate),
        description: data.description,
      });
      toast.success("Expense recorded!");
    } catch {
      toast.error("Failed to record expense.");
      throw new Error("Failed");
    }
  }

  async function handleUpdate(data: ExpenseFormData) {
    if (!editExpense) return;
    try {
      await updateExpense.mutateAsync({
        id: editExpense.id,
        category: data.category,
        amount: BigInt(Math.round(Number.parseFloat(data.amount || "0") * 100)),
        gstAmount: BigInt(
          Math.round(Number.parseFloat(data.gstAmount || "0") * 100),
        ),
        expenseDate: dateStringToNs(data.expenseDate),
        description: data.description,
      });
      toast.success("Expense updated!");
    } catch {
      toast.error("Failed to update expense.");
      throw new Error("Failed");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      toast.success("Expense deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete expense.");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Expenses
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="expenses.create.open_modal_button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
        </Button>
      </div>

      {/* Summary cards */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-xl font-bold tabular-nums text-destructive">
              {formatINR(totalExpenses)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground mb-1">
              Input GST Credit
            </p>
            <p className="text-xl font-bold tabular-nums text-info">
              {formatINR(totalGst)}
            </p>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="expenses.search_input"
          className="pl-9"
          placeholder="Search by category or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-14"
            data-ocid="expenses.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? "No expenses match your search" : "No expenses yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Record first expense
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="expenses.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Vendor
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    GST
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Description
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense, idx) => (
                  <motion.tr
                    key={expense.id.toString()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`expenses.item.${idx + 1}`}
                  >
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2 py-0.5 bg-accent/30 text-accent-foreground rounded text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                      {expense.vendorId
                        ? (vendorMap.get(expense.vendorId.toString()) ?? "—")
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                      {formatINR(expense.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-info tabular-nums hidden sm:table-cell">
                      {formatINR(expense.gstAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                      <p className="truncate max-w-[200px]">
                        {expense.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          data-ocid={`expenses.edit_button.${idx + 1}`}
                          onClick={() => setEditExpense(expense)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`expenses.delete_button.${idx + 1}`}
                          onClick={() => setDeleteId(expense.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        vendors={vendors}
        onSubmit={handleCreate}
        title="Record Expense"
      />
      <ExpenseModal
        open={editExpense !== null}
        onClose={() => setEditExpense(null)}
        vendors={vendors}
        onSubmit={handleUpdate}
        initialData={editExpense}
        title="Edit Expense"
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        description="This will permanently delete this expense record."
        ocidPrefix="expenses.delete"
      />
    </div>
  );
}
