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
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { INDIAN_STATES } from "../utils/indianStates";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateBusinessModal({ open, onClose }: Props) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const { setActiveBusinessId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gstin: "",
    state: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Business name is required";
    if (form.gstin && form.gstin.length !== 15)
      errs.gstin = "GSTIN must be exactly 15 characters";
    if (!form.state) errs.state = "State is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!actor) return;
    setLoading(true);
    try {
      const newId = await actor.createBusiness(
        form.name,
        form.gstin,
        form.state,
        form.address,
      );
      toast.success(`Business "${form.name}" created!`);
      await qc.invalidateQueries({ queryKey: ["businesses"] });
      await qc.refetchQueries({ queryKey: ["businesses"] });
      setActiveBusinessId(newId);
      setForm({ name: "", gstin: "", state: "", address: "" });
      onClose();
    } catch {
      toast.error("Failed to create business.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="create_business.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add New Business
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cb-name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cb-name"
              data-ocid="create_business.input"
              placeholder="e.g. Kumar Trading Co"
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

          <div className="space-y-1.5">
            <Label htmlFor="cb-gstin">GSTIN (optional)</Label>
            <Input
              id="cb-gstin"
              placeholder="15-character GSTIN"
              maxLength={15}
              value={form.gstin}
              onChange={(e) => {
                setForm((p) => ({
                  ...p,
                  gstin: e.target.value.toUpperCase(),
                }));
                setErrors((p) => ({ ...p, gstin: "" }));
              }}
            />
            {errors.gstin && (
              <p className="text-destructive text-xs">{errors.gstin}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              State <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.state}
              onValueChange={(v) => {
                setForm((p) => ({ ...p, state: v }));
                setErrors((p) => ({ ...p, state: "" }));
              }}
            >
              <SelectTrigger data-ocid="create_business.select">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-destructive text-xs">{errors.state}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-address">Address</Label>
            <Textarea
              id="cb-address"
              rows={2}
              placeholder="Business address"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="create_business.cancel_button"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="create_business.submit_button"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Creating…" : "Create Business"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
