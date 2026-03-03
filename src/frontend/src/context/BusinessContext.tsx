import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Business } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  activeBusinessId: bigint | null;
  setActiveBusinessId: (id: bigint) => void;
  isLoading: boolean;
  refetchBusinesses: () => void;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined,
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [activeBusinessId, setActiveBusinessId] = useState<bigint | null>(null);

  const {
    data: businesses = [],
    isLoading,
    refetch,
  } = useQuery<Business[]>({
    queryKey: ["businesses", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBusinesses();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30_000,
  });

  // Auto-select first business
  useEffect(() => {
    if (businesses.length > 0 && activeBusinessId === null) {
      setActiveBusinessId(businesses[0].id);
    }
    // If active business was deleted
    if (
      activeBusinessId !== null &&
      businesses.length > 0 &&
      !businesses.find((b) => b.id === activeBusinessId)
    ) {
      setActiveBusinessId(businesses[0].id);
    }
  }, [businesses, activeBusinessId]);

  const activeBusiness =
    businesses.find((b) => b.id === activeBusinessId) ?? null;

  const handleSetActiveBusinessId = (id: bigint) => {
    setActiveBusinessId(id);
    // Invalidate all business-related queries when switching
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        activeBusinessId,
        setActiveBusinessId: handleSetActiveBusinessId,
        isLoading: isLoading || isFetching,
        refetchBusinesses: refetch,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
