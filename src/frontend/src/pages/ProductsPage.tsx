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
import {
  Edit2,
  Lightbulb,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useBusiness } from "../context/BusinessContext";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../hooks/useQueries";
import {
  fuzzyMatchProduct,
  getBusinessCategory,
  getCategoryByName,
  getEffectiveCategoryProducts,
} from "../utils/companyCategories";
import { formatINR } from "../utils/formatINR";
import { GST_RATES } from "../utils/indianStates";

interface ProductFormData {
  name: string;
  hsnCode: string;
  gstRate: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
}

const EMPTY_PRODUCT: ProductFormData = {
  name: "",
  hsnCode: "",
  gstRate: "18",
  purchasePrice: "",
  sellingPrice: "",
  stockQuantity: "0",
};

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  title: string;
  businessId?: string;
}

function ProductModal({
  open,
  onClose,
  initialData,
  onSubmit,
  title,
  businessId = "",
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(EMPTY_PRODUCT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // GST auto-suggestion
  const bizCategory = businessId ? getBusinessCategory(businessId) : "";
  const categoryObj = bizCategory ? getCategoryByName(bizCategory) : null;

  // Suggested GST for the current category
  const suggestedGstForCategory = categoryObj
    ? (getEffectiveCategoryProducts(categoryObj)[0]?.gstRate.toString() ??
      categoryObj.defaultGstSlab.toString())
    : null;

  // Fuzzy match product name to get HSN/GST suggestion
  const [productSuggestion, setProductSuggestion] = useState<{
    hsnCode: string;
    gstRate: number;
    productName: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name,
          hsnCode: initialData.hsnCode,
          gstRate: initialData.gstRate.toString(),
          purchasePrice: (Number(initialData.purchasePrice) / 100).toString(),
          sellingPrice: (Number(initialData.sellingPrice) / 100).toString(),
          stockQuantity: initialData.stockQuantity.toString(),
        });
      } else {
        setForm(EMPTY_PRODUCT);
      }
      setErrors({});
      setProductSuggestion(null);
    }
  }, [open, initialData]);

  function handleNameChange(value: string) {
    setForm((p) => ({ ...p, name: value }));
    setErrors((p) => ({ ...p, name: "" }));

    if (value.trim().length >= 3) {
      const match = fuzzyMatchProduct(value, categoryObj?.id);
      if (match) {
        setProductSuggestion({
          hsnCode: match.hsnCode,
          gstRate: match.gstRate,
          productName: match.name,
        });
      } else {
        setProductSuggestion(null);
      }
    } else {
      setProductSuggestion(null);
    }
  }

  function applyProductSuggestion() {
    if (!productSuggestion) return;
    setForm((p) => ({
      ...p,
      hsnCode: productSuggestion.hsnCode,
      gstRate: productSuggestion.gstRate.toString(),
    }));
    toast.success(
      `Applied suggestion: HSN ${productSuggestion.hsnCode}, ${productSuggestion.gstRate}% GST`,
    );
    setProductSuggestion(null);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.sellingPrice || Number.parseFloat(form.sellingPrice) < 0)
      errs.sellingPrice = "Valid selling price required";
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
      <DialogContent className="sm:max-w-md" data-ocid="product.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="product.name_input"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
            {/* Fuzzy match product suggestion */}
            {productSuggestion && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  Match: <strong>{productSuggestion.productName}</strong> → HSN{" "}
                  {productSuggestion.hsnCode}, {productSuggestion.gstRate}% GST
                </p>
                <button
                  type="button"
                  onClick={applyProductSuggestion}
                  className="text-xs text-primary font-semibold hover:underline flex-shrink-0"
                >
                  Use this
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>HSN Code</Label>
              <Input
                placeholder="e.g. 8471"
                value={form.hsnCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hsnCode: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>GST Rate</Label>
              <Select
                value={form.gstRate}
                onValueChange={(v) => setForm((p) => ({ ...p, gstRate: v }))}
              >
                <SelectTrigger data-ocid="product.gst_select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      {r}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Category-based GST suggestion */}
              {suggestedGstForCategory && bizCategory && (
                <div className="flex items-center gap-2 mt-1">
                  <Lightbulb className="w-3 h-3 text-primary/60" />
                  <p className="text-[10px] text-muted-foreground">
                    Suggested: <strong>{suggestedGstForCategory}%</strong> for{" "}
                    {bizCategory}{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          gstRate: suggestedGstForCategory,
                        }))
                      }
                      className="text-primary font-semibold hover:underline"
                    >
                      [Use this]
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Purchase Price (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchasePrice: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Selling Price (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                data-ocid="product.selling_price_input"
                placeholder="0.00"
                value={form.sellingPrice}
                onChange={(e) => {
                  setForm((p) => ({ ...p, sellingPrice: e.target.value }));
                  setErrors((p) => ({ ...p, sellingPrice: "" }));
                }}
              />
              {errors.sellingPrice && (
                <p className="text-destructive text-xs">
                  {errors.sellingPrice}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Stock Quantity</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.stockQuantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, stockQuantity: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="product.cancel_button"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="product.submit_button"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving…" : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { activeBusinessId } = useBusiness();
  const bizIdStr = activeBusinessId?.toString() ?? "";

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.hsnCode.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(data: ProductFormData) {
    try {
      await createProduct.mutateAsync({
        name: data.name,
        hsnCode: data.hsnCode,
        gstRate: BigInt(Number.parseInt(data.gstRate, 10) || 0),
        purchasePrice: BigInt(
          Math.round(Number.parseFloat(data.purchasePrice || "0") * 100),
        ),
        sellingPrice: BigInt(
          Math.round(Number.parseFloat(data.sellingPrice || "0") * 100),
        ),
        stockQuantity: BigInt(Number.parseInt(data.stockQuantity || "0", 10)),
      });
      toast.success(`Product "${data.name}" added!`);
    } catch {
      toast.error("Failed to add product.");
      throw new Error("Failed");
    }
  }

  async function handleUpdate(data: ProductFormData) {
    if (!editProduct) return;
    try {
      await updateProduct.mutateAsync({
        id: editProduct.id,
        name: data.name,
        hsnCode: data.hsnCode,
        gstRate: BigInt(Number.parseInt(data.gstRate, 10) || 0),
        purchasePrice: BigInt(
          Math.round(Number.parseFloat(data.purchasePrice || "0") * 100),
        ),
        sellingPrice: BigInt(
          Math.round(Number.parseFloat(data.sellingPrice || "0") * 100),
        ),
        stockQuantity: BigInt(Number.parseInt(data.stockQuantity || "0", 10)),
      });
      toast.success("Product updated!");
    } catch {
      toast.error("Failed to update product.");
      throw new Error("Failed");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast.success("Product deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete product.");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          data-ocid="products.create.open_modal_button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product</span>
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="products.search_input"
          className="pl-9"
          placeholder="Search products or HSN code…"
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
            data-ocid="products.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search ? "No products match your search" : "No products yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add first product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="products.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    HSN
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    GST
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Purchase
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Selling
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, idx) => (
                  <motion.tr
                    key={product.id.toString()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`products.item.${idx + 1}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {product.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {product.hsnCode || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                        {product.gstRate.toString()}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                      {formatINR(product.purchasePrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold">
                      {formatINR(product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-muted-foreground hidden sm:table-cell">
                      {product.stockQuantity.toString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          data-ocid={`products.edit_button.${idx + 1}`}
                          onClick={() => setEditProduct(product)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`products.delete_button.${idx + 1}`}
                          onClick={() => setDeleteId(product.id)}
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

      <ProductModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Add Product"
        businessId={bizIdStr}
      />
      <ProductModal
        open={editProduct !== null}
        onClose={() => setEditProduct(null)}
        onSubmit={handleUpdate}
        initialData={editProduct}
        title="Edit Product"
        businessId={bizIdStr}
      />
      <DeleteConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product?"
        description="This will permanently delete this product."
        ocidPrefix="products.delete"
      />
    </div>
  );
}
