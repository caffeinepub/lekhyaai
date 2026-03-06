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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Edit3,
  Loader2,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BusinessRole, type BusinessUserRole } from "../backend.d";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ─── Role Config ─────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  BusinessRole,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
    description: string;
  }
> = {
  [BusinessRole.admin]: {
    label: "Admin",
    icon: ShieldAlert,
    badge:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    description: "Full access — can manage users, settings, and all modules",
  },
  [BusinessRole.accountant]: {
    label: "Accountant",
    icon: ShieldCheck,
    badge:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    description: "Can manage invoices, expenses, ledger, and reports",
  },
  [BusinessRole.ca]: {
    label: "CA",
    icon: Shield,
    badge:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    description: "Chartered Accountant — read-only + GST report generation",
  },
};

// Default permission matrix
const DEFAULT_PERMISSION_MATRIX: PermissionRow[] = [
  { feature: "View Dashboard", admin: true, accountant: true, ca: true },
  {
    feature: "Create / Edit Invoices",
    admin: true,
    accountant: true,
    ca: false,
  },
  {
    feature: "Create / Edit Expenses",
    admin: true,
    accountant: true,
    ca: false,
  },
  {
    feature: "Manage Customers / Vendors",
    admin: true,
    accountant: true,
    ca: false,
  },
  { feature: "Post Journal Entries", admin: true, accountant: true, ca: false },
  { feature: "Generate GST Reports", admin: true, accountant: true, ca: true },
  { feature: "View Ledger & Reports", admin: true, accountant: true, ca: true },
  { feature: "Manage Users", admin: true, accountant: false, ca: false },
  { feature: "Business Settings", admin: true, accountant: false, ca: false },
  { feature: "Bank Accounts", admin: true, accountant: true, ca: false },
  { feature: "Export Reports", admin: true, accountant: true, ca: true },
  { feature: "Petty Cash", admin: true, accountant: true, ca: false },
  { feature: "Tally Import", admin: true, accountant: false, ca: false },
  { feature: "GST Filing Calendar", admin: true, accountant: true, ca: true },
  { feature: "B2B Reconciliation", admin: true, accountant: true, ca: false },
  { feature: "AI Assistant", admin: true, accountant: true, ca: true },
  {
    feature: "Subscription & Billing",
    admin: true,
    accountant: false,
    ca: false,
  },
  { feature: "Company Categories", admin: true, accountant: true, ca: false },
];

interface PermissionRow {
  feature: string;
  admin: boolean;
  accountant: boolean;
  ca: boolean;
}

const RBAC_STORAGE_KEY = "lekhyaai_rbac_matrix";

function loadPermissions(): PermissionRow[] {
  try {
    const stored = localStorage.getItem(RBAC_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PermissionRow[];
      // Merge with defaults — new features added after save are included
      const merged = DEFAULT_PERMISSION_MATRIX.map((def) => {
        const saved = parsed.find((p) => p.feature === def.feature);
        return saved ?? def;
      });
      return merged;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PERMISSION_MATRIX;
}

function savePermissions(matrix: PermissionRow[]) {
  localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(matrix));
}

// ─── Editable Permission Matrix ───────────────────────────────────
function PermissionMatrix({ canEdit }: { canEdit: boolean }) {
  const [editMode, setEditMode] = useState(false);
  const [matrix, setMatrix] = useState<PermissionRow[]>(loadPermissions);
  const [draft, setDraft] = useState<PermissionRow[]>([]);

  function startEdit() {
    setDraft(matrix.map((r) => ({ ...r })));
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft([]);
    setEditMode(false);
  }

  function saveEdit() {
    setMatrix(draft);
    savePermissions(draft);
    setEditMode(false);
    setDraft([]);
    toast.success("Permission matrix saved");
  }

  function resetDefaults() {
    if (!confirm("Reset all permissions to default values?")) return;
    setMatrix(DEFAULT_PERMISSION_MATRIX);
    savePermissions(DEFAULT_PERMISSION_MATRIX);
    if (editMode) {
      setDraft(DEFAULT_PERMISSION_MATRIX.map((r) => ({ ...r })));
    }
    toast.success("Permissions reset to defaults");
  }

  function toggleCell(idx: number, role: "admin" | "accountant" | "ca") {
    if (!editMode) return;
    setDraft((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [role]: !row[role] } : row)),
    );
  }

  const displayMatrix = editMode ? draft : matrix;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-card"
    >
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">Role Permissions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canEdit
              ? "Click the edit button to customise what each role can access"
              : "What each role can access in this business"}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {!editMode ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid="rbac.reset.button"
                  onClick={resetDefaults}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  data-ocid="rbac.edit.button"
                  onClick={startEdit}
                  className="gap-1.5 text-xs bg-primary text-primary-foreground"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Matrix
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid="rbac.cancel.button"
                  onClick={cancelEdit}
                  className="gap-1.5 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  data-ocid="rbac.save.button"
                  onClick={saveEdit}
                  className="gap-1.5 text-xs bg-primary text-primary-foreground"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {editMode && (
        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Edit mode active — click any check/X cell to toggle. Admin column is
            locked (always full access).
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                Feature / Module
              </th>
              {(["admin", "accountant", "ca"] as const).map((role) => {
                const cfg = ROLE_CONFIG[role as BusinessRole];
                return (
                  <th
                    key={role}
                    className="text-center px-4 py-3 text-xs font-medium min-w-[90px]"
                  >
                    <Badge
                      variant="outline"
                      className={cn("text-xs", cfg.badge)}
                    >
                      {cfg.label}
                    </Badge>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayMatrix.map((row, idx) => (
              <tr
                key={row.feature}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  idx % 2 === 0 && "bg-muted/5",
                  editMode && "hover:bg-primary/5",
                )}
                data-ocid={`users.permissions.row.${idx + 1}`}
              >
                <td className="px-5 py-3 text-sm text-foreground">
                  {row.feature}
                </td>
                {(["admin", "accountant", "ca"] as const).map((role) => {
                  const value = row[role];
                  const isAdminCol = role === "admin";
                  const clickable = editMode && !isAdminCol;
                  return (
                    <td
                      key={role}
                      className={cn(
                        "px-4 py-3 text-center",
                        clickable && "cursor-pointer select-none group",
                      )}
                      onClick={
                        clickable ? () => toggleCell(idx, role) : undefined
                      }
                      onKeyDown={
                        clickable
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ")
                                toggleCell(idx, role);
                            }
                          : undefined
                      }
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      data-ocid={
                        clickable
                          ? `rbac.cell.${idx + 1}.${role}.toggle`
                          : undefined
                      }
                    >
                      {value ? (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full",
                            clickable
                              ? "bg-success/10 group-hover:bg-destructive/10 transition-colors"
                              : "",
                          )}
                        >
                          <Check className="w-4 h-4 text-success" />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full",
                            clickable
                              ? "bg-muted/40 group-hover:bg-success/10 transition-colors"
                              : "",
                          )}
                        >
                          <X className="w-4 h-4 text-destructive/50" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Changes are saved to this browser. Admin always has full access and
            cannot be restricted.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Invite User Dialog ──────────────────────────────────────────
function InviteUserDialog({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (principal: string, role: BusinessRole) => Promise<void>;
}) {
  const [principalId, setPrincipalId] = useState("");
  const [role, setRole] = useState<BusinessRole>(BusinessRole.accountant);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!principalId.trim()) {
      toast.error("Principal ID is required");
      return;
    }
    try {
      Principal.fromText(principalId.trim());
    } catch {
      toast.error("Invalid Principal ID format");
      return;
    }
    setSaving(true);
    try {
      await onInvite(principalId.trim(), role);
      setPrincipalId("");
      setRole(BusinessRole.accountant);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="users.invite.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>
              User Principal ID <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="users.principal_id.input"
              placeholder="e.g. rno2h-3aaaa-aaaaa-aaaaa-cai"
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              The Internet Identity principal of the user you want to invite
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as BusinessRole)}
            >
              <SelectTrigger data-ocid="users.invite_role.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.values(BusinessRole) as BusinessRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      {ROLE_CONFIG[r].label} — {ROLE_CONFIG[r].description}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const cfg = ROLE_CONFIG[role];
                  return (
                    <>
                      <cfg.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {cfg.label} Role
                      </span>
                    </>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                {ROLE_CONFIG[role].description}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            data-ocid="users.invite.cancel_button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            data-ocid="users.invite.submit_button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function UsersPage() {
  const { activeBusiness } = useBusiness();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery<BusinessUserRole[]>({
    queryKey: ["business_users", activeBusiness?.id.toString()],
    queryFn: async () => {
      if (!actor || !activeBusiness) return [];
      return actor.getBusinessUsers(activeBusiness.id);
    },
    enabled: !!actor && !isFetching && !!activeBusiness,
    staleTime: 30_000,
  });

  const { data: myRole } = useQuery<BusinessRole | null>({
    queryKey: ["my_business_role", activeBusiness?.id.toString()],
    queryFn: async () => {
      if (!actor || !activeBusiness) return null;
      return actor.getMyBusinessRole(activeBusiness.id);
    },
    enabled: !!actor && !isFetching && !!activeBusiness,
    staleTime: 30_000,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({
      principalId,
      role,
    }: {
      principalId: string;
      role: BusinessRole;
    }) => {
      if (!actor || !activeBusiness) throw new Error("Not ready");
      const principal = Principal.fromText(principalId);
      return actor.inviteUserToBusinessRole(activeBusiness.id, principal, role);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["business_users"] });
      toast.success("User invited successfully");
    },
    onError: () => {
      toast.error("Failed to invite user");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (roleId: bigint) => {
      if (!actor) throw new Error("Not ready");
      return actor.removeBusinessUser(roleId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["business_users"] });
      toast.success("User removed");
    },
    onError: () => {
      toast.error("Failed to remove user");
    },
  });

  async function handleInvite(principalId: string, role: BusinessRole) {
    await inviteMutation.mutateAsync({ principalId, role });
  }

  function handleRemove(user: BusinessUserRole) {
    if (!confirm(`Remove ${user.userPrincipal.toString()} from this business?`))
      return;
    removeMutation.mutate(user.id);
  }

  const isOwner =
    activeBusiness?.owner.toString() === identity?.getPrincipal().toString();
  const canManage = isOwner || myRole === BusinessRole.admin;

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
            <Users className="w-7 h-7 text-primary/80" />
            Users & Access
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage who has access to {activeBusiness?.name}
          </p>
        </div>
        {canManage && (
          <Button
            data-ocid="users.invite.open_modal_button"
            onClick={() => setInviteOpen(true)}
            className="bg-primary text-primary-foreground gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Current User Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            You ({isOwner ? "Owner" : "Member"})
          </p>
          <p className="text-xs font-mono text-muted-foreground truncate">
            {identity?.getPrincipal().toString()}
          </p>
        </div>
        {isOwner ? (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
            Owner
          </Badge>
        ) : myRole ? (
          <Badge variant="outline" className={cn(ROLE_CONFIG[myRole].badge)}>
            {ROLE_CONFIG[myRole].label}
          </Badge>
        ) : null}
      </motion.div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card mb-8">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="font-semibold text-foreground">Team Members</h3>
          <span className="text-xs text-muted-foreground">
            {users.length} member{users.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="users.list.loading_state">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 gap-3 text-center"
            data-ocid="users.list.empty_state"
          >
            <Users className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              No team members invited yet
            </p>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                data-ocid="users.invite_first.button"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Invite your first member
              </Button>
            )}
          </div>
        ) : (
          <Table data-ocid="users.list.table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Principal ID</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">
                  Invited By
                </TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Since
                </TableHead>
                {canManage && (
                  <TableHead className="text-xs text-center">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => {
                const roleCfg = ROLE_CONFIG[user.role];
                const isCurrentUser =
                  user.userPrincipal.toString() ===
                  identity?.getPrincipal().toString();
                return (
                  <TableRow
                    key={user.id.toString()}
                    data-ocid={`users.list.item.${idx + 1}`}
                    className={cn(isCurrentUser && "bg-primary/5")}
                  >
                    <TableCell className="font-mono text-xs max-w-[180px] truncate">
                      {user.userPrincipal.toString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs gap-1", roleCfg.badge)}
                      >
                        <roleCfg.icon className="w-3 h-3" />
                        {roleCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[140px] hidden sm:table-cell">
                      {user.invitedBy.toString().slice(0, 20)}…
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(
                        Number(user.createdAt / 1_000_000n),
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-center">
                        {!isCurrentUser && (
                          <button
                            type="button"
                            data-ocid={`users.remove.delete_button.${idx + 1}`}
                            onClick={() => handleRemove(user)}
                            disabled={removeMutation.isPending}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Editable Permission Matrix */}
      <PermissionMatrix canEdit={canManage} />

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
