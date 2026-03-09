import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ClientTenant } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Locked state ─────────────────────────────────────────────────────────────
function LockedScreen() {
  return (
    <div
      data-ocid="tenant_mgmt.locked.error_state"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="font-display text-2xl text-foreground">
        SuperUser Access Required
      </h2>
      <p className="text-muted-foreground max-w-sm">
        Tenant Management is visible only to SuperUser / Developer accounts.
        Activate Developer Mode via{" "}
        <a
          href="/app/superuser-settings"
          className="text-primary underline underline-offset-2"
        >
          SuperUser Settings
        </a>{" "}
        using your PIN.
      </p>
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="w-3 h-3" />
        Access Denied
      </Badge>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const PLANS = ["Basic", "Professional", "Enterprise"];

function formatDate(timeNs: bigint): string {
  const ms = Number(timeNs) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(timeNs: bigint): number {
  const ms = Number(timeNs) / 1_000_000;
  return Math.ceil((ms - Date.now()) / (24 * 60 * 60 * 1000));
}

function StatusBadge({ tenant }: { tenant: ClientTenant }) {
  const days = daysUntil(tenant.subscriptionEndDate);
  const status = tenant.status;

  if (status === "suspended") {
    return (
      <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold">
        Suspended
      </Badge>
    );
  }
  if (status === "expired" || days <= 0) {
    return (
      <Badge className="bg-muted text-muted-foreground border border-border text-xs font-semibold">
        Expired
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold">
        Expiring Soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-success/10 text-success border border-success/20 text-xs font-semibold">
      Active
    </Badge>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function TenantDetailModal({
  tenant,
  open,
  onClose,
}: {
  tenant: ClientTenant | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!tenant) return null;
  const days = daysUntil(tenant.subscriptionEndDate);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="tenant_mgmt.detail.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {tenant.businessName}
          </DialogTitle>
          <DialogDescription>{tenant.contactEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-muted/40 rounded-xl p-4">
            <div className="text-muted-foreground">Tenant ID</div>
            <div className="font-mono font-bold text-primary">
              {tenant.tenantId}
            </div>
            <div className="text-muted-foreground">Plan</div>
            <div className="font-medium">{tenant.subscriptionPlan}</div>
            <div className="text-muted-foreground">Status</div>
            <div>
              <StatusBadge tenant={tenant} />
            </div>
            <div className="text-muted-foreground">Start Date</div>
            <div>{formatDate(tenant.subscriptionStartDate)}</div>
            <div className="text-muted-foreground">End Date</div>
            <div>
              {formatDate(tenant.subscriptionEndDate)}
              {days > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({days}d left)
                </span>
              )}
            </div>
            <div className="text-muted-foreground">Provisioned</div>
            <div>{formatDate(tenant.provisionedAt)}</div>
            {tenant.crmLeadId !== undefined && (
              <>
                <div className="text-muted-foreground">CRM Lead ID</div>
                <div className="font-mono text-xs">
                  {tenant.crmLeadId.toString()}
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="tenant_mgmt.detail.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Extend Subscription Modal ────────────────────────────────────────────────
function ExtendModal({
  tenant,
  open,
  onClose,
  onExtend,
}: {
  tenant: ClientTenant | null;
  open: boolean;
  onClose: () => void;
  onExtend: (
    tenantId: string,
    plan: string,
    additionalDays: number,
  ) => Promise<void>;
}) {
  const [plan, setPlan] = useState(tenant?.subscriptionPlan ?? "Professional");
  const [days, setDays] = useState(365);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) setPlan(tenant.subscriptionPlan);
  }, [tenant]);

  if (!tenant) return null;

  async function handleSubmit() {
    if (!days || days < 1) {
      toast.error("Please enter a valid number of days");
      return;
    }
    setSaving(true);
    try {
      await onExtend(tenant!.tenantId, plan, days);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-ocid="tenant_mgmt.extend.dialog">
        <DialogHeader>
          <DialogTitle>Extend Subscription</DialogTitle>
          <DialogDescription>
            Update plan and extend for {tenant.businessName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger data-ocid="tenant_mgmt.extend.plan.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Additional Days</Label>
            <Input
              data-ocid="tenant_mgmt.extend.days.input"
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Current end date: {formatDate(tenant.subscriptionEndDate)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="tenant_mgmt.extend.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            data-ocid="tenant_mgmt.extend.confirm_button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provision Modal ──────────────────────────────────────────────────────────
function ProvisionModal({
  open,
  onClose,
  onProvision,
}: {
  open: boolean;
  onClose: () => void;
  onProvision: (
    businessName: string,
    email: string,
    plan: string,
    days: number,
  ) => Promise<void>;
}) {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Professional");
  const [days, setDays] = useState(365);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!businessName.trim() || !email.trim()) {
      toast.error("Business name and email are required");
      return;
    }
    setSaving(true);
    try {
      await onProvision(businessName.trim(), email.trim(), plan, days);
      setBusinessName("");
      setEmail("");
      setPlan("Professional");
      setDays(365);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        data-ocid="tenant_mgmt.provision.dialog"
      >
        <DialogHeader>
          <DialogTitle>Provision New Tenant</DialogTitle>
          <DialogDescription>
            Manually create a new client tenant environment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input
              data-ocid="tenant_mgmt.provision.business_name.input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sunrise Traders Pvt Ltd"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input
              data-ocid="tenant_mgmt.provision.email.input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger data-ocid="tenant_mgmt.provision.plan.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration (days)</Label>
            <Input
              data-ocid="tenant_mgmt.provision.duration.input"
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="tenant_mgmt.provision.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            data-ocid="tenant_mgmt.provision.confirm_button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Provision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TenantManagementPage() {
  const devModeActive = localStorage.getItem("lekhya_superuser_active") === "1";

  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<ClientTenant[]>([]);

  const [detailTenant, setDetailTenant] = useState<ClientTenant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [extendTenant, setExtendTenant] = useState<ClientTenant | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);

  const [provisionOpen, setProvisionOpen] = useState(false);

  async function fetchTenants() {
    if (!actor || actorFetching) return;
    setLoading(true);
    try {
      const data = await actor.getClientTenants();
      setTenants(data);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchTenants is stable within render
  useEffect(() => {
    if (!devModeActive) return;
    fetchTenants();
  }, [devModeActive, actor, actorFetching]);

  if (!devModeActive) {
    return <LockedScreen />;
  }

  async function handleSuspend(tenantId: string, businessName: string) {
    if (!actor) return;
    try {
      await actor.suspendTenant(tenantId);
      toast.success(`${businessName} suspended`);
      await fetchTenants();
    } catch {
      toast.error("Failed to suspend tenant");
    }
  }

  async function handleReactivate(tenantId: string, businessName: string) {
    if (!actor) return;
    try {
      await actor.reactivateTenant(tenantId);
      toast.success(`${businessName} reactivated`);
      await fetchTenants();
    } catch {
      toast.error("Failed to reactivate tenant");
    }
  }

  async function handleExtend(
    tenantId: string,
    plan: string,
    additionalDays: number,
  ) {
    if (!actor) return;
    await actor.updateTenantSubscription(
      tenantId,
      plan,
      BigInt(additionalDays),
    );
    toast.success("Subscription extended");
    await fetchTenants();
  }

  async function handleProvision(
    businessName: string,
    email: string,
    plan: string,
    days: number,
  ) {
    if (!actor || !identity) {
      toast.error("Not authenticated");
      return;
    }
    const principal = identity.getPrincipal();
    const tenantId = await actor.provisionClientTenant(
      principal,
      businessName,
      email,
      plan,
      BigInt(days),
    );
    toast.success(`Tenant provisioned: ${tenantId}`);
    await fetchTenants();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              Tenant Management
            </h1>
            <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-bold rounded-full border border-destructive/20">
              SUPERUSER
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage all client tenant environments and subscriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="tenant_mgmt.refresh.button"
            variant="outline"
            size="sm"
            onClick={fetchTenants}
            disabled={loading || actorFetching}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            data-ocid="tenant_mgmt.provision.open_modal_button"
            size="sm"
            onClick={() => setProvisionOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Provision New Tenant
          </Button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Client Tenants
            {tenants.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({tenants.length} total)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div
            className="py-16 flex flex-col items-center gap-3"
            data-ocid="tenant_mgmt.tenants.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading tenants…</p>
          </div>
        ) : tenants.length === 0 ? (
          <div
            className="py-16 flex flex-col items-center gap-3 text-center"
            data-ocid="tenant_mgmt.tenants.empty_state"
          >
            <Server className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              No tenants provisioned yet. Use "Provision New Tenant" to create
              the first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="tenant_mgmt.tenants.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant ID</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant, idx) => (
                  <TableRow
                    key={tenant.tenantId}
                    data-ocid={`tenant_mgmt.tenant.item.${idx + 1}`}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      setDetailTenant(tenant);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs text-primary font-bold">
                      {tenant.tenantId}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {tenant.businessName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenant.contactEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {tenant.subscriptionPlan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tenant={tenant} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tenant.subscriptionEndDate)}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {tenant.status === "suspended" ? (
                          <Button
                            data-ocid={`tenant_mgmt.reactivate.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-success border-success/30 hover:bg-success/10"
                            onClick={() =>
                              handleReactivate(
                                tenant.tenantId,
                                tenant.businessName,
                              )
                            }
                          >
                            <PlayCircle className="w-3.5 h-3.5 mr-1" />
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            data-ocid={`tenant_mgmt.suspend.button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() =>
                              handleSuspend(
                                tenant.tenantId,
                                tenant.businessName,
                              )
                            }
                          >
                            <PauseCircle className="w-3.5 h-3.5 mr-1" />
                            Suspend
                          </Button>
                        )}
                        <Button
                          data-ocid={`tenant_mgmt.extend.open_modal_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setExtendTenant(tenant);
                            setExtendOpen(true);
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Extend
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TenantDetailModal
        tenant={detailTenant}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailTenant(null);
        }}
      />
      <ExtendModal
        tenant={extendTenant}
        open={extendOpen}
        onClose={() => {
          setExtendOpen(false);
          setExtendTenant(null);
        }}
        onExtend={handleExtend}
      />
      <ProvisionModal
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onProvision={handleProvision}
      />

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
