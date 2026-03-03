import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Plus, Search, Trash2, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vendor } from "../backend.d";
import ContactModal, { type ContactFormData } from "../components/ContactModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import {
  useCreateVendor,
  useDeleteVendor,
  useUpdateVendor,
  useVendors,
} from "../hooks/useQueries";
import { formatDate } from "../utils/formatINR";

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [createOpen, setCreateOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.gstin.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(data: ContactFormData) {
    try {
      await createVendor.mutateAsync(data);
      toast.success(`Vendor "${data.name}" added!`);
    } catch {
      toast.error("Failed to add vendor.");
      throw new Error("Failed");
    }
  }

  async function handleUpdate(data: ContactFormData) {
    if (!editVendor) return;
    try {
      await updateVendor.mutateAsync({ id: editVendor.id, ...data });
      toast.success("Vendor updated!");
    } catch {
      toast.error("Failed to update vendor.");
      throw new Error("Failed");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteVendor.mutateAsync(deleteId);
      toast.success("Vendor deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete vendor.");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Vendors
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="vendors.create.open_modal_button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Vendor</span>
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="vendors.search_input"
          className="pl-9"
          placeholder="Search vendors…"
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
            data-ocid="vendors.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Truck className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? "No vendors match your search" : "No vendors yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add first vendor
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="vendors.table">
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
                {filtered.map((vendor, idx) => (
                  <motion.tr
                    key={vendor.id.toString()}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`vendors.item.${idx + 1}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">
                        {vendor.name}
                      </p>
                      {vendor.address && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {vendor.address}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {vendor.gstin || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {vendor.phone || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                      {vendor.email || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          data-ocid={`vendors.edit_button.${idx + 1}`}
                          onClick={() => setEditVendor(vendor)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`vendors.delete_button.${idx + 1}`}
                          onClick={() => setDeleteId(vendor.id)}
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
        title="Add Vendor"
        entityLabel="Vendor"
        ocidPrefix="vendor_create"
      />
      <ContactModal
        open={editVendor !== null}
        onClose={() => setEditVendor(null)}
        onSubmit={handleUpdate}
        initialData={editVendor ?? undefined}
        title="Edit Vendor"
        entityLabel="Vendor"
        ocidPrefix="vendor_edit"
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Vendor?"
        description="This will permanently delete the vendor."
        ocidPrefix="vendors.delete"
      />
    </div>
  );
}
