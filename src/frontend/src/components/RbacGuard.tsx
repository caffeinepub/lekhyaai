import { useNavigate } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect } from "react";
import {
  type RbacModule,
  getCurrentUserRole,
  hasPermission,
} from "../utils/rbac";
import { isSuperUserActive } from "../utils/superuser";

interface Props {
  module: RbacModule;
  children: React.ReactNode;
}

export default function RbacGuard({ module, children }: Props) {
  const navigate = useNavigate();
  const isSuperUser = isSuperUserActive();
  const currentRole = getCurrentUserRole();
  const allowed = isSuperUser || hasPermission(module, currentRole);

  useEffect(() => {
    if (!allowed) {
      void navigate({ to: "/app" });
    }
  }, [allowed, navigate]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <Shield className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="font-display text-xl text-foreground">
          Access Restricted
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Your current role does not have access to this module. Contact your
          admin to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
