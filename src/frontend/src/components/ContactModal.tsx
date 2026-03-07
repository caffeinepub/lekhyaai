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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { INDIAN_STATES } from "../utils/indianStates";

const GSTIN_STATE_MAP: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

export interface ContactFormData {
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  state: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
  title: string;
  entityLabel: string; // "Customer" | "Vendor"
  ocidPrefix: string;
  showState?: boolean; // Show state dropdown (for customers)
}

const EMPTY: ContactFormData = {
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  state: "",
};

export default function ContactModal({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
  entityLabel,
  ocidPrefix,
  showState = false,
}: Props) {
  const [form, setForm] = useState<ContactFormData>({
    ...EMPTY,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initialData });
      setErrors({});
    }
  }, [open, initialData]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = `${entityLabel} name is required`;
    if (form.gstin && form.gstin.length !== 15)
      errs.gstin = "GSTIN must be exactly 15 characters";
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
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        data-ocid={`${ocidPrefix}.dialog`}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${ocidPrefix}-name`}>
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${ocidPrefix}-name`}
              data-ocid={`${ocidPrefix}.input`}
              placeholder={`${entityLabel} name`}
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: "" }));
              }}
            />
            {errors.name && (
              <p
                className="text-destructive text-xs"
                data-ocid={`${ocidPrefix}.name_error`}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${ocidPrefix}-gstin`}>GSTIN (15 chars)</Label>
            <Input
              id={`${ocidPrefix}-gstin`}
              placeholder="27AAAPL1234C1Z5"
              maxLength={15}
              value={form.gstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setForm((p) => {
                  const next = { ...p, gstin: val };
                  if (showState && val.length === 15) {
                    const prefix = val.slice(0, 2);
                    const derivedState = GSTIN_STATE_MAP[prefix];
                    if (derivedState && !p.state) {
                      next.state = derivedState;
                    }
                  }
                  return next;
                });
                setErrors((p) => ({ ...p, gstin: "" }));
              }}
            />
            {form.gstin && form.gstin.length !== 15 && (
              <p className="text-muted-foreground text-xs">
                {form.gstin.length}/15 characters
              </p>
            )}
            {errors.gstin && (
              <p
                className="text-destructive text-xs"
                data-ocid={`${ocidPrefix}.gstin_error`}
              >
                {errors.gstin}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${ocidPrefix}-phone`}>Phone</Label>
              <Input
                id={`${ocidPrefix}-phone`}
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${ocidPrefix}-email`}>Email</Label>
              <Input
                id={`${ocidPrefix}-email`}
                type="email"
                placeholder="contact@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${ocidPrefix}-address`}>Address</Label>
            <Textarea
              id={`${ocidPrefix}-address`}
              rows={2}
              placeholder="Full address"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>

          {showState && (
            <div className="space-y-1.5">
              <Label htmlFor={`${ocidPrefix}-state`}>State</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}
              >
                <SelectTrigger
                  id={`${ocidPrefix}-state`}
                  data-ocid={`${ocidPrefix}.state_select`}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid={`${ocidPrefix}.cancel_button`}
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid={`${ocidPrefix}.submit_button`}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
