import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  List,
  Users,
  PiggyBank,
  Settings,
  Wallet,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Desktop-only: toggle collapsed (icon-only) mode */
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen, onClose, onToggleCollapse, isCollapsed = false }: SidebarProps) {
  const location         = useLocation();
  const { user, logout } = useAuth();
  const isMobile         = useIsMobile();
  const { t }            = useTranslation();

  const navItems = [
    { path: "/",            label: t("nav.dashboard"),   icon: LayoutDashboard },
    { path: "/add-expense", label: t("nav.add_expense"), icon: Plus            },
    { path: "/expenses",    label: t("nav.expenses"),    icon: List            },
    { path: "/groups",      label: t("nav.groups"),      icon: Users           },
    { path: "/budget",      label: t("nav.budget"),      icon: PiggyBank       },
    { path: "/settings",    label: t("nav.settings"),    icon: Settings        },
  ];

  const displayName  = user?.name || user?.username || user?.email || "Guest User";
  const userInitials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl    = user?.avatar_url || undefined;

  // Collapsed width: 72px (icon only), expanded: 280px
  const sidebarWidth = !isMobile && isCollapsed ? "w-[72px]" : "w-[280px]";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out",
        "bg-sidebar backdrop-blur-xl border-r border-sidebar-border shadow-2xl",
        sidebarWidth,
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="relative h-[80px] flex items-center px-4 mb-2 border-b border-sidebar-border/50 flex-shrink-0">
        <div className="flex items-center gap-3 group cursor-pointer overflow-hidden">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-lg tracking-tight text-sidebar-foreground leading-none whitespace-nowrap">Aura Finance</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Smart AI Engine</span>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle */}
        {!isMobile && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "absolute h-7 w-7 rounded-full border border-sidebar-border bg-sidebar shadow-sm",
              "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all",
              isCollapsed ? "right-1/2 translate-x-1/2 top-auto bottom-[-14px]" : "right-[-14px] top-1/2 -translate-y-1/2"
            )}
          >
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </Button>
        )}

        {/* Mobile close button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar py-4">
        {!isCollapsed && (
          <p className="px-3 mb-3 text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em]">
            {t("nav.menu")}
          </p>
        )}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon     = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                )}
                <div className={cn(
                  "flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0",
                  isActive ? "text-primary" : "group-hover:text-sidebar-foreground"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!isCollapsed && (
                  <span className={cn(
                    "font-semibold text-sm transition-all duration-200 whitespace-nowrap",
                    isActive ? "translate-x-0.5" : "group-hover:translate-x-1"
                  )}>
                    {item.label}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Section */}
      <div className={cn("p-3 mt-auto border-t border-sidebar-border/50", isCollapsed && "px-2")}>
        <div className={cn(
          "rounded-2xl bg-sidebar-accent/30 p-3 border border-sidebar-border/50 shadow-sm transition-all duration-300",
          isCollapsed && "p-2"
        )}>
          {user && (
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none group flex-shrink-0">
                    <Avatar className="transition-transform duration-300 group-hover:scale-105 border-2 border-white shadow-sm w-10 h-10">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                      <AvatarFallback className="!bg-white !text-slate-900 font-black text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 p-2 rounded-xl shadow-2xl border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <DropdownMenuLabel className="font-bold flex items-center gap-2">
                    <User size={16} /> {t("nav.my_account")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem className="rounded-lg cursor-pointer py-2 font-medium focus:bg-sidebar-accent">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>{t("nav.security_settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer py-2 font-medium text-red-400 focus:text-red-400 focus:bg-red-400/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("nav.log_out")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-sidebar-foreground truncate leading-none mb-1">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">
                        {t("nav.online")}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground flex-shrink-0">
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="w-40 p-1 rounded-lg bg-sidebar border-sidebar-border">
                      <DropdownMenuItem onClick={logout} className="text-red-400 font-bold text-xs uppercase tracking-wider rounded-md focus:bg-red-400/10">
                        {t("nav.log_out")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
