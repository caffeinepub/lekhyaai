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
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { INDIAN_STATES } from "../utils/indianStates";

export default function OnboardingPage() {
  const { actor } = useActor();
  const qc = useQueryClient();
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
      await actor.createBusiness(
        form.name,
        form.gstin,
        form.state,
        form.address,
      );
      toast.success("Business created! Welcome to LekhyaAI.");
      await qc.invalidateQueries({ queryKey: ["businesses"] });
      await qc.refetchQueries({ queryKey: ["businesses"] });
    } catch {
      toast.error("Failed to create business. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">
            Set up your business
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your first business to get started with GST-compliant
            accounting
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Name */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-name" className="font-medium text-sm">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="biz-name"
                data-ocid="onboarding.input"
                placeholder="e.g. Sharma Enterprises Pvt Ltd"
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

            {/* GSTIN */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-gstin" className="font-medium text-sm">
                GSTIN{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="biz-gstin"
                placeholder="e.g. 27AAAPL1234C1Z5"
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
              <p className="text-xs text-muted-foreground">
                15-character GSTIN — can be added later
              </p>
              {errors.gstin && (
                <p className="text-destructive text-xs">{errors.gstin}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label className="font-medium text-sm">
                State <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.state}
                onValueChange={(v) => {
                  setForm((p) => ({ ...p, state: v }));
                  setErrors((p) => ({ ...p, state: "" }));
                }}
              >
                <SelectTrigger data-ocid="onboarding.select">
                  <SelectValue placeholder="Select your state" />
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

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="biz-address" className="font-medium text-sm">
                Business Address
              </Label>
              <Textarea
                id="biz-address"
                placeholder="Street, City, PIN Code"
                value={form.address}
                rows={3}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>

            <Button
              type="submit"
              data-ocid="onboarding.submit_button"
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  Creating business…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Business & Continue
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
