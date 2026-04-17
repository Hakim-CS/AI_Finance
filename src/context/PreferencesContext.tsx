/**
 * PreferencesContext
 * ─────────────────
 * Global store for user preferences that need to be visible across ALL pages:
 *   • currency  (e.g. "TRY", "USD")
 *   • language  (e.g. "en", "tr")
 *
 * Usage anywhere in the app:
 *   const { currency, formatAmount } = usePreferences();
 *
 * The Settings page writes back here via updatePreferences().
 * Changes are immediately reflected on Dashboard, Budget, Expenses, etc.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import i18n from "../i18n";

// ─── Currency metadata ────────────────────────────────────────────────────────

export const CURRENCIES: Record<string, { symbol: string; locale: string; label: string }> = {
  TRY: { symbol: "₺", locale: "tr-TR", label: "Turkish Lira" },
  USD: { symbol: "$", locale: "en-US", label: "US Dollar"    },
  EUR: { symbol: "€", locale: "de-DE", label: "Euro"         },
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
  currency:   string;
  language:   string;
  prefs:      PreferencesState;
  isLoading:  boolean;

  /** Format a number as currency string using the user's selected currency */
  formatAmount: (amount: number, opts?: { compact?: boolean }) => string;

  /** Update one or more preference fields — does NOT save to backend */
  setPrefs: (patch: Partial<PreferencesState>) => void;

  /** Save current preferences to backend */
  savePrefs: (token: string) => Promise<void>;

  /** Load preferences from backend (called after login) */
  loadPrefs: (token: string) => Promise<void>;
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
    // Rehydrate from localStorage on cold start so pages don't flash default currency
    try {
      const stored = localStorage.getItem("userPrefs");
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Persist any change to localStorage immediately (instant cross-page reactivity)
  const setPrefs = useCallback((patch: Partial<PreferencesState>) => {
    _setPrefs(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem("userPrefs", JSON.stringify(next));
      // If language changed, switch i18next immediately
      if (patch.language && patch.language !== prev.language) {
        i18n.changeLanguage(patch.language);
      }
      return next;
    });
  }, []);

  const loadPrefs = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5001/auth/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const merged = { ...DEFAULT, ...data };
      _setPrefs(merged);
      localStorage.setItem("userPrefs", JSON.stringify(merged));
      // Apply saved language immediately on login
      if (merged.language) i18n.changeLanguage(merged.language);
    } catch {
      // silently keep defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePrefs = useCallback(async (token: string) => {
    await fetch("http://localhost:5001/auth/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(prefs),
    });
  }, [prefs]);

  const formatAmount = useCallback(
    (amount: number, opts?: { compact?: boolean }) => {
      const cur = CURRENCIES[prefs.currency] ?? CURRENCIES.TRY;
      try {
        return new Intl.NumberFormat(cur.locale, {
          style:    "currency",
          currency: prefs.currency,
          notation: opts?.compact ? "compact" : "standard",
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
      value={{ currency: prefs.currency, language: prefs.language, prefs, isLoading, formatAmount, setPrefs, savePrefs, loadPrefs }}
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
