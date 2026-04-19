import { API_BASE } from "@/lib/api";
/**
 * DeletionBanner
 * ──────────────
 * Displays a sticky top banner whenever the user's account is in the
 * 14-day soft-delete grace period. Shows a live countdown and a "Restore
 * Account" button that calls POST /auth/account/restore.
 *
 * Rendered inside AppLayout so it appears on every authenticated page.
 */
import { useState, useEffect } from "react";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "0d";
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

export function DeletionBanner() {
  const { token, deletionDate, clearDeletionState, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [restoring,  setRestoring]  = useState(false);
  const [countdown,  setCountdown]  = useState("");

  // Update countdown every minute
  useEffect(() => {
    if (!deletionDate) return;
    const target = new Date(deletionDate);
    const update = () => setCountdown(formatCountdown(target));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [deletionDate]);

  if (!deletionDate) return null;

  const deletionTarget = new Date(deletionDate);
  const isExpired      = deletionTarget.getTime() <= Date.now();

  const handleRestore = async () => {
    if (!token) return;
    setRestoring(true);
    try {
      const res = await fetch(`${API_BASE}/auth/account/restore`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Restore failed");
      clearDeletionState();
      toast({
        title:       t('settings.security.restoreAccount'),
        description: t('settings.security.restoreAccountDesc'),
      });
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="w-full bg-amber-500 dark:bg-amber-600 text-white px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-40 shadow-sm">
      <div className="flex items-start sm:items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-sm">
          <span className="font-bold">{t('settings.security.deletionScheduled')}.</span>{" "}
          {isExpired ? (
            <span>{t('banner.graceExpired')}</span>
          ) : (
            <span>
              {t('banner.deletingIn')}{" "}
              <span className="font-mono font-black underline underline-offset-2">{countdown}</span>
              {" "}({deletionTarget.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}).
              {" "}{t('banner.restoreNow')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isExpired && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 rounded-lg bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs gap-1.5 border-0 shadow-none"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('settings.security.restoring')}</>
              : <><RotateCcw className="w-3.5 h-3.5" /> {t('settings.security.restore')}</>
            }
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-lg text-white hover:bg-amber-600/50 font-bold text-xs"
          onClick={logout}
        >
          {t('settings.security.signOut')}
        </Button>
      </div>
    </div>
  );
}
