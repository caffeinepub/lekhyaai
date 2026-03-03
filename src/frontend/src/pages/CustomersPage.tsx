import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";
import ContactModal, { type ContactFormData } from "../components/ContactModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks/useQueries";
import { formatDate } from "../utils/formatINR";

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(data: ContactFormData) {
    try {
      await createCustomer.mutateAsync(data);
      toast.success(`Customer "${data.name}" added!`);
    } catch {
      toast.error("Failed to add customer.");
      throw new Error("Failed");
    }
  }

  async function handleUpdate(data: ContactFormData) {
    if (!editCustomer) return;
    try {
      await updateCustomer.mutateAsync({ id: editCustomer.id, ...data });
      toast.success("Customer updated!");
    } catch {
      toast.error("Failed to update customer.");
      throw new Error("Failed");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteCustomer.mutateAsync(deleteId);
      toast.success("Customer deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete customer.");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="customers.create.open_modal_button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Customer</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="customers.search_input"
          className="pl-9"
          placeholder="Search by name, email, or GSTIN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
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
            data-ocid="customers.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? "No customers match your search" : "No customers yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add first customer
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="customers.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    GSTIN
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Added
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, idx) => (
                  <motion.tr
                    key={customer.id.toString()}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`customers.item.${idx + 1}`}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">
                          {customer.name}
                        </p>
                        {customer.address && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {customer.address}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {customer.gstin || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                      {customer.email || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          data-ocid={`customers.edit_button.${idx + 1}`}
                          onClick={() => setEditCustomer(customer)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`customers.delete_button.${idx + 1}`}
                          onClick={() => setDeleteId(customer.id)}
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

      <ContactModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Add Customer"
        entityLabel="Customer"
        ocidPrefix="customer_create"
        showState={true}
      />
      <ContactModal
        open={editCustomer !== null}
        onClose={() => setEditCustomer(null)}
        onSubmit={handleUpdate}
        initialData={
          editCustomer
            ? {
                ...editCustomer,
                state:
                  (
                    JSON.parse(
                      localStorage.getItem("customer_states") || "{}",
                    ) as Record<string, string>
                  )[editCustomer.id.toString()] ?? "",
              }
            : undefined
        }
        title="Edit Customer"
        entityLabel="Customer"
        ocidPrefix="customer_edit"
        showState={true}
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer?"
        description="This will permanently delete the customer."
        ocidPrefix="customers.delete"
      />
    </div>
  );
}
