import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { usePreferences } from "@/context/PreferencesContext";
import { DeletionBanner } from "./DeletionBanner";

/**
 * ThemeBridge — registers next-themes setTheme with PreferencesContext on mount.
 * This ensures the DB theme drives <html class="dark"> from the very first render,
 * regardless of which page the user lands on.
 */
function ThemeBridge() {
  const { setTheme } = useTheme();
  const { registerThemeSetter } = usePreferences();
  useEffect(() => {
    registerThemeSetter(setTheme);
  }, [registerThemeSetter, setTheme]);
  return null;
}

interface AppLayoutProps {
  children: ReactNode;
}

const COLLAPSED_KEY = "sidebarCollapsed";

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed,   setIsCollapsed]   = useState(() => {
    // persist collapse state in localStorage so it survives page refresh
    try { return localStorage.getItem(COLLAPSED_KEY) === "true"; } catch { return false; }
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  // Sidebar actual pixel width drives main content margin
  const sidebarPx = isMobile ? 0 : isCollapsed ? 72 : 280;

  return (
    <div className="min-h-screen w-full bg-background flex overflow-hidden">
      <ThemeBridge />

      {/* Mobile floating menu button */}
      {isMobile && !isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl h-10 w-10 flex items-center justify-center"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45] animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => isMobile && setIsSidebarOpen(false)}
        isCollapsed={!isMobile && isCollapsed}
        onToggleCollapse={!isMobile ? toggleCollapse : undefined}
      />

      {/* Right-hand column: deletion banner + page content */}
      <div
        className="flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out overflow-y-auto"
        style={{ marginLeft: isSidebarOpen ? `${sidebarPx}px` : 0 }}
      >
        <DeletionBanner />
        <main className="flex-1 bg-slate-50/30 dark:bg-background">
          <div className={cn(
            "p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in",
            isMobile && "pt-20"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
