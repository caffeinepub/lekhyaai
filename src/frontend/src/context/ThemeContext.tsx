import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Theme Definitions ────────────────────────────────────────────────────────
export interface ThemeDefinition {
  name: string;
  label: string;
  primary: string;
  primaryFg: string;
  secondary: string;
  secondaryFg: string;
  accent: string;
  accentFg: string;
  ring: string;
  sidebar: string;
  sidebarFg: string;
  sidebarAccent: string;
  sidebarAccentFg: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    name: "teal",
    label: "Teal",
    primary: "0.42 0.12 185",
    primaryFg: "0.99 0 0",
    secondary: "0.93 0.025 185",
    secondaryFg: "0.3 0.08 185",
    accent: "0.88 0.08 80",
    accentFg: "0.22 0.06 55",
    ring: "0.42 0.12 185",
    sidebar: "0.15 0.04 220",
    sidebarFg: "0.92 0.015 185",
    sidebarAccent: "0.22 0.05 220",
    sidebarAccentFg: "0.88 0.03 185",
    sidebarBorder: "0.25 0.04 220",
    sidebarRing: "0.55 0.12 185",
  },
  {
    name: "saffron",
    label: "Saffron",
    primary: "0.65 0.18 65",
    primaryFg: "0.12 0.04 55",
    secondary: "0.94 0.04 65",
    secondaryFg: "0.35 0.1 65",
    accent: "0.72 0.14 185",
    accentFg: "0.12 0.04 185",
    ring: "0.65 0.18 65",
    sidebar: "0.14 0.04 50",
    sidebarFg: "0.92 0.03 65",
    sidebarAccent: "0.22 0.06 50",
    sidebarAccentFg: "0.88 0.04 65",
    sidebarBorder: "0.26 0.05 50",
    sidebarRing: "0.65 0.14 65",
  },
  {
    name: "purple",
    label: "Purple",
    primary: "0.45 0.18 290",
    primaryFg: "0.99 0 0",
    secondary: "0.93 0.04 290",
    secondaryFg: "0.3 0.1 290",
    accent: "0.72 0.14 110",
    accentFg: "0.12 0.04 110",
    ring: "0.45 0.18 290",
    sidebar: "0.13 0.05 280",
    sidebarFg: "0.92 0.02 290",
    sidebarAccent: "0.2 0.06 280",
    sidebarAccentFg: "0.88 0.03 290",
    sidebarBorder: "0.24 0.06 280",
    sidebarRing: "0.55 0.14 290",
  },
  {
    name: "emerald",
    label: "Emerald",
    primary: "0.5 0.18 155",
    primaryFg: "0.99 0 0",
    secondary: "0.93 0.04 155",
    secondaryFg: "0.3 0.1 155",
    accent: "0.75 0.15 80",
    accentFg: "0.15 0.05 65",
    ring: "0.5 0.18 155",
    sidebar: "0.13 0.04 175",
    sidebarFg: "0.92 0.02 155",
    sidebarAccent: "0.2 0.05 175",
    sidebarAccentFg: "0.88 0.03 155",
    sidebarBorder: "0.24 0.05 175",
    sidebarRing: "0.55 0.14 155",
  },
  {
    name: "rose",
    label: "Rose",
    primary: "0.55 0.22 15",
    primaryFg: "0.99 0 0",
    secondary: "0.94 0.05 15",
    secondaryFg: "0.32 0.1 15",
    accent: "0.72 0.14 250",
    accentFg: "0.12 0.04 250",
    ring: "0.55 0.22 15",
    sidebar: "0.14 0.05 10",
    sidebarFg: "0.92 0.02 15",
    sidebarAccent: "0.21 0.06 10",
    sidebarAccentFg: "0.88 0.03 15",
    sidebarBorder: "0.25 0.06 10",
    sidebarRing: "0.55 0.14 15",
  },
  {
    name: "slate",
    label: "Slate",
    primary: "0.38 0.06 250",
    primaryFg: "0.99 0 0",
    secondary: "0.93 0.02 250",
    secondaryFg: "0.3 0.05 250",
    accent: "0.65 0.15 185",
    accentFg: "0.12 0.03 185",
    ring: "0.38 0.06 250",
    sidebar: "0.14 0.03 245",
    sidebarFg: "0.9 0.015 250",
    sidebarAccent: "0.21 0.04 245",
    sidebarAccentFg: "0.86 0.02 250",
    sidebarBorder: "0.25 0.04 245",
    sidebarRing: "0.5 0.08 250",
  },
];

// ─── Context Types ─────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: string;
  isDark: boolean;
  logoUrl: string | null;
  signatureUrl: string | null;
  setTheme: (name: string) => void;
  toggleDark: () => void;
  setLogo: (dataUrl: string | null) => void;
  setSignature: (dataUrl: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── LocalStorage Keys ─────────────────────────────────────────────────────────
const LS_THEME = "lekhya_theme";
const LS_DARK = "lekhya_dark";
const LS_LOGO = "lekhya_logo";
const LS_SIGNATURE = "lekhya_signature";

// ─── Apply theme tokens to :root ──────────────────────────────────────────────
function applyThemeTokens(theme: ThemeDefinition, isDark: boolean) {
  const root = document.documentElement;

  // Apply primary-related tokens
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", theme.primaryFg);
  root.style.setProperty(
    "--secondary",
    isDark ? "0.22 0.04 220" : theme.secondary,
  );
  root.style.setProperty(
    "--secondary-foreground",
    isDark ? "0.82 0.02 185" : theme.secondaryFg,
  );
  root.style.setProperty("--accent", isDark ? theme.accent : theme.accent);
  root.style.setProperty("--accent-foreground", theme.accentFg);
  root.style.setProperty("--ring", theme.ring);

  // Sidebar tokens
  root.style.setProperty("--sidebar", theme.sidebar);
  root.style.setProperty("--sidebar-foreground", theme.sidebarFg);
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty("--sidebar-primary-foreground", theme.primaryFg);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", theme.sidebarAccentFg);
  root.style.setProperty("--sidebar-border", theme.sidebarBorder);
  root.style.setProperty("--sidebar-ring", theme.sidebarRing);

  // Chart colors driven by primary hue
  root.style.setProperty("--chart-1", theme.primary);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(
    () => localStorage.getItem(LS_THEME) ?? "teal",
  );
  const [isDark, setIsDark] = useState<boolean>(
    () => localStorage.getItem(LS_DARK) === "true",
  );
  const [logoUrl, setLogoState] = useState<string | null>(() =>
    localStorage.getItem(LS_LOGO),
  );
  const [signatureUrl, setSignatureState] = useState<string | null>(() =>
    localStorage.getItem(LS_SIGNATURE),
  );

  // Apply theme tokens whenever theme or dark mode changes
  useEffect(() => {
    const def = THEMES.find((t) => t.name === theme) ?? THEMES[0];
    applyThemeTokens(def, isDark);
  }, [theme, isDark]);

  // Toggle .dark class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  function setTheme(name: string) {
    setThemeState(name);
    localStorage.setItem(LS_THEME, name);
  }

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(LS_DARK, String(next));
      return next;
    });
  }

  function setLogo(dataUrl: string | null) {
    setLogoState(dataUrl);
    if (dataUrl) {
      localStorage.setItem(LS_LOGO, dataUrl);
    } else {
      localStorage.removeItem(LS_LOGO);
    }
  }

  function setSignature(dataUrl: string | null) {
    setSignatureState(dataUrl);
    if (dataUrl) {
      localStorage.setItem(LS_SIGNATURE, dataUrl);
    } else {
      localStorage.removeItem(LS_SIGNATURE);
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        logoUrl,
        signatureUrl,
        setTheme,
        toggleDark,
        setLogo,
        setSignature,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
