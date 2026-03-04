import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Save,
  Search,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  COMPANY_CATEGORIES,
  type CategoryProduct,
  getEffectiveCategoryProducts,
  saveCategoryProductOverride,
} from "../utils/companyCategories";
import { GST_RATES } from "../utils/indianStates";

const GST_SLAB_COLORS: Record<number, string> = {
  0: "bg-success/15 text-success border-success/20",
  5: "bg-info/15 text-info border-info/20",
  12: "bg-warning/15 text-warning border-warning/20",
  18: "bg-primary/15 text-primary border-primary/20",
  28: "bg-destructive/15 text-destructive border-destructive/20",
};

interface EditingProduct {
  categoryId: string;
  productIndex: number;
  data: CategoryProduct;
}

interface AddingProduct {
  categoryId: string;
  data: CategoryProduct;
}

export default function CompanyCategoriesPage() {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingProduct | null>(null);
  const [adding, setAdding] = useState<AddingProduct | null>(null);
  // Local overrides cache (re-read from localStorage on demand)
  const [, forceRender] = useState(0);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = COMPANY_CATEGORIES.filter(
    (cat) =>
      search === "" ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.products.some((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  function handleSaveEdit() {
    if (!editing) return;
    const cat = COMPANY_CATEGORIES.find((c) => c.id === editing.categoryId);
    if (!cat) return;
    const products = [...getEffectiveCategoryProducts(cat)];
    products[editing.productIndex] = editing.data;
    saveCategoryProductOverride(editing.categoryId, products);
    setEditing(null);
    forceRender((n) => n + 1);
    toast.success("Product updated successfully!");
  }

  function handleAddProduct() {
    if (!adding) return;
    if (!adding.data.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    const cat = COMPANY_CATEGORIES.find((c) => c.id === adding.categoryId);
    if (!cat) return;
    const products = [...getEffectiveCategoryProducts(cat), adding.data];
    saveCategoryProductOverride(adding.categoryId, products);
    setAdding(null);
    forceRender((n) => n + 1);
    toast.success("Product added successfully!");
  }

  function handleDeleteProduct(categoryId: string, productIndex: number) {
    const cat = COMPANY_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    const products = getEffectiveCategoryProducts(cat).filter(
      (_, i) => i !== productIndex,
    );
    saveCategoryProductOverride(categoryId, products);
    forceRender((n) => n + 1);
    toast.success("Product removed.");
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              Company Categories & GST Master
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1 ml-13">
          Manage company types, their products, and default GST rates
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="categories.search_input"
          className="pl-9"
          placeholder="Search categories or products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {filtered.map((cat, catIdx) => {
          const isExpanded = expandedIds.has(cat.id);
          const products = getEffectiveCategoryProducts(cat);

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.03 }}
              className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
              data-ocid={`categories.item.${catIdx + 1}`}
            >
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {products.length} product
                      {products.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      GST_SLAB_COLORS[cat.defaultGstSlab] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    Default {cat.defaultGstSlab}% GST
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Products table */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border">
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                                Product Name
                              </th>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                                HSN Code
                              </th>
                              <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">
                                GST Rate
                              </th>
                              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                                Unit
                              </th>
                              <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((product, pIdx) => {
                              const isEditingThis =
                                editing?.categoryId === cat.id &&
                                editing.productIndex === pIdx;

                              if (isEditingThis && editing) {
                                return (
                                  <tr
                                    // biome-ignore lint/suspicious/noArrayIndexKey: positional edit row
                                    key={`edit-${pIdx}`}
                                    className="border-b border-border bg-primary/5"
                                  >
                                    <td className="px-4 py-2">
                                      <Input
                                        value={editing.data.name}
                                        onChange={(e) =>
                                          setEditing((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  data: {
                                                    ...prev.data,
                                                    name: e.target.value,
                                                  },
                                                }
                                              : prev,
                                          )
                                        }
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-2 hidden sm:table-cell">
                                      <Input
                                        value={editing.data.hsnCode}
                                        onChange={(e) =>
                                          setEditing((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  data: {
                                                    ...prev.data,
                                                    hsnCode: e.target.value,
                                                  },
                                                }
                                              : prev,
                                          )
                                        }
                                        className="h-8 text-xs font-mono"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <Select
                                        value={editing.data.gstRate.toString()}
                                        onValueChange={(v) =>
                                          setEditing((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  data: {
                                                    ...prev.data,
                                                    gstRate: Number.parseInt(
                                                      v,
                                                      10,
                                                    ),
                                                  },
                                                }
                                              : prev,
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {GST_RATES.map((r) => (
                                            <SelectItem
                                              key={r}
                                              value={r.toString()}
                                            >
                                              {r}%
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-2 hidden md:table-cell">
                                      <Input
                                        value={editing.data.unit}
                                        onChange={(e) =>
                                          setEditing((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  data: {
                                                    ...prev.data,
                                                    unit: e.target.value,
                                                  },
                                                }
                                              : prev,
                                          )
                                        }
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          data-ocid={`categories.product.save_button.${pIdx + 1}`}
                                          onClick={handleSaveEdit}
                                          className="text-success hover:text-success/80 p-1.5 rounded hover:bg-success/10"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          data-ocid={`categories.product.cancel_button.${pIdx + 1}`}
                                          onClick={() => setEditing(null)}
                                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  // biome-ignore lint/suspicious/noArrayIndexKey: positional product row
                                  key={`prod-${pIdx}`}
                                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                                  data-ocid={`categories.product.row.${pIdx + 1}`}
                                >
                                  <td className="px-4 py-3 font-medium text-foreground text-sm">
                                    {product.name}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                                    {product.hsnCode}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        GST_SLAB_COLORS[product.gstRate] ??
                                          "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {product.gstRate}%
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                                    {product.unit}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        data-ocid={`categories.product.edit_button.${pIdx + 1}`}
                                        onClick={() =>
                                          setEditing({
                                            categoryId: cat.id,
                                            productIndex: pIdx,
                                            data: { ...product },
                                          })
                                        }
                                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-primary/10"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        data-ocid={`categories.product.delete_button.${pIdx + 1}`}
                                        onClick={() =>
                                          handleDeleteProduct(cat.id, pIdx)
                                        }
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Add product inline row */}
                            {adding?.categoryId === cat.id && (
                              <tr className="border-b border-border bg-success/5">
                                <td className="px-4 py-2">
                                  <Input
                                    placeholder="Product name"
                                    value={adding.data.name}
                                    onChange={(e) =>
                                      setAdding((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              data: {
                                                ...prev.data,
                                                name: e.target.value,
                                              },
                                            }
                                          : prev,
                                      )
                                    }
                                    className="h-8 text-xs"
                                    autoFocus
                                  />
                                </td>
                                <td className="px-4 py-2 hidden sm:table-cell">
                                  <Input
                                    placeholder="HSN Code"
                                    value={adding.data.hsnCode}
                                    onChange={(e) =>
                                      setAdding((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              data: {
                                                ...prev.data,
                                                hsnCode: e.target.value,
                                              },
                                            }
                                          : prev,
                                      )
                                    }
                                    className="h-8 text-xs font-mono"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <Select
                                    value={adding.data.gstRate.toString()}
                                    onValueChange={(v) =>
                                      setAdding((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              data: {
                                                ...prev.data,
                                                gstRate: Number.parseInt(v, 10),
                                              },
                                            }
                                          : prev,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {GST_RATES.map((r) => (
                                        <SelectItem
                                          key={r}
                                          value={r.toString()}
                                        >
                                          {r}%
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-2 hidden md:table-cell">
                                  <Input
                                    placeholder="Unit"
                                    value={adding.data.unit}
                                    onChange={(e) =>
                                      setAdding((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              data: {
                                                ...prev.data,
                                                unit: e.target.value,
                                              },
                                            }
                                          : prev,
                                      )
                                    }
                                    className="h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      data-ocid="categories.add_product.save_button"
                                      onClick={handleAddProduct}
                                      className="text-success hover:text-success/80 p-1.5 rounded hover:bg-success/10"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      data-ocid="categories.add_product.cancel_button"
                                      onClick={() => setAdding(null)}
                                      className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Product button */}
                      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {products.length} product
                          {products.length !== 1 ? "s" : ""} in this category
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`categories.add_product_${cat.id}.button`}
                          onClick={() => {
                            setEditing(null);
                            setAdding({
                              categoryId: cat.id,
                              data: {
                                name: "",
                                hsnCode: "",
                                gstRate: cat.defaultGstSlab,
                                unit: "Nos",
                              },
                            });
                          }}
                          className="gap-1.5 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Product
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          GST Rate Legend
        </p>
        <div className="flex flex-wrap gap-2">
          {[0, 5, 12, 18, 28].map((rate) => (
            <Badge
              key={rate}
              variant="outline"
              className={cn(
                "text-xs",
                GST_SLAB_COLORS[rate] ?? "bg-muted text-muted-foreground",
              )}
            >
              {rate}% GST
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8 py-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
