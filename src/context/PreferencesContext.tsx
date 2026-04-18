import { API_BASE } from "@/lib/api";
/**
 * PreferencesContext
 * ─────────────────
 * Global store for user preferences: currency, language, theme, notifications.
 *
 * Persistence chain (in priority order):
 *   DB (UserPreferences table)
 *     → loaded via loadPrefs() after login AND on every page refresh
 *     → saved via savePrefs() when user clicks Save on Settings
 *   localStorage ("userPrefs")
 *     → written on every setPrefs() call for instant cross-tab reactivity
 *     → read on cold start as a fast-path before DB responds
 *
 * Theme sync:
 *   next-themes controls the actual CSS class on <html>. We keep prefs.theme
 *   in sync by calling the setTheme() hook injected via setThemeCallback.
 *   Settings.tsx registers this callback via useEffect once next-themes is ready.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import i18n from "../i18n";

// ─── Currency metadata ────────────────────────────────────────────────────────

export const CURRENCIES: Record<string, { symbol: string; locale: string; label: string }> = {
  TRY: { symbol: "₺", locale: "tr-TR", label: "Turkish Lira"  },
  USD: { symbol: "$", locale: "en-US", label: "US Dollar"     },
  EUR: { symbol: "€", locale: "de-DE", label: "Euro"          },
  GBP: { symbol: "£", locale: "en-GB", label: "British Pound" },
};

export const LANGUAGES: Record<string, { label: string; locale: string }> = {
  en: { label: "English",  locale: "en" },
  tr: { label: "Türkçe",   locale: "tr" },
  de: { label: "Deutsch",  locale: "de" },
  fr: { label: "Français", locale: "fr" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreferencesState {
  currency:            string;
  language:            string;
  notif_email:         boolean;
  notif_budget_alerts: boolean;
  notif_weekly_report: boolean;
  notif_ai_insights:   boolean;
  theme:               string;
}

interface PreferencesContextType {
  currency:  string;
  language:  string;
  prefs:     PreferencesState;
  isLoading: boolean;

  /** Format a number as currency string using the user's selected currency */
  formatAmount: (amount: number, opts?: { compact?: boolean }) => string;

  /** Update one or more preference fields (does NOT save to backend, but writes localStorage + applies side-effects) */
  setPrefs: (patch: Partial<PreferencesState>) => void;

  /** Save current preferences to backend */
  savePrefs: (token: string) => Promise<void>;

  /** Load preferences from backend (called after login AND on page refresh) */
  loadPrefs: (token: string) => Promise<void>;

  /**
   * Register the next-themes setTheme function so PreferencesContext can
   * drive the actual CSS theme class. Called once from Settings.tsx.
   */
  registerThemeSetter: (setter: (theme: string) => void) => void;
}

const DEFAULT: PreferencesState = {
  currency:            "TRY",
  language:            "en",
  notif_email:         true,
  notif_budget_alerts: true,
  notif_weekly_report: true,
  notif_ai_insights:   true,
  theme:               "system",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, _setPrefs] = useState<PreferencesState>(() => {
    // Rehydrate from localStorage on cold start so pages don't flash defaults
    try {
      const stored = localStorage.getItem("userPrefs");
      const merged = stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
      // Apply language immediately from localStorage so i18next is ready before DB responds
      if (merged.language && merged.language !== "en") {
        i18n.changeLanguage(merged.language);
      }
      return merged;
    } catch {
      return DEFAULT;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // next-themes setTheme callback — registered by the component that uses useTheme()
  const themeSetterRef = useRef<((t: string) => void) | null>(null);

  const registerThemeSetter = useCallback((setter: (t: string) => void) => {
    themeSetterRef.current = setter;
  }, []);

  /** Apply all side-effects from a new prefs state */
  const applySideEffects = useCallback((next: PreferencesState, prev?: PreferencesState) => {
    // Language
    if (!prev || next.language !== prev.language) {
      i18n.changeLanguage(next.language);
    }
    // Theme — drives next-themes so the <html> class updates
    if (themeSetterRef.current && (!prev || next.theme !== prev.theme)) {
      themeSetterRef.current(next.theme);
    }
  }, []);

  const setPrefs = useCallback((patch: Partial<PreferencesState>) => {
    _setPrefs(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("userPrefs", JSON.stringify(next));
      applySideEffects(next, prev);
      return next;
    });
  }, [applySideEffects]);

  const loadPrefs = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const merged = { ...DEFAULT, ...data };
      _setPrefs(merged);
      localStorage.setItem("userPrefs", JSON.stringify(merged));
      // Apply side-effects with no previous state so everything is forced
      applySideEffects(merged);
    } catch {
      // Silently keep whatever is in state (localStorage fallback already applied)
    } finally {
      setIsLoading(false);
    }
  }, [applySideEffects]);

  const savePrefs = useCallback(async (token: string) => {
    const res = await fetch(`${API_BASE}/auth/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to save preferences");
    }
  }, [prefs]);

  const formatAmount = useCallback(
    (amount: number, opts?: { compact?: boolean }) => {
      const cur = CURRENCIES[prefs.currency] ?? CURRENCIES.TRY;
      try {
        return new Intl.NumberFormat(cur.locale, {
          style:                 "currency",
          currency:              prefs.currency,
          notation:              opts?.compact ? "compact" : "standard",
          maximumFractionDigits: opts?.compact ? 1 : 2,
        }).format(amount);
      } catch {
        return `${cur.symbol}${amount.toLocaleString()}`;
      }
    },
    [prefs.currency]
  );

  return (
    <PreferencesContext.Provider
      value={{
        currency: prefs.currency,
        language: prefs.language,
        prefs,
        isLoading,
        formatAmount,
        setPrefs,
        savePrefs,
        loadPrefs,
        registerThemeSetter,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
};
