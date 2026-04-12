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
  X
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/add-expense", label: "Add Expense", icon: Plus },
  { path: "/expenses", label: "Expenses", icon: List },
  { path: "/groups", label: "Groups", icon: Users },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const displayName = user?.name || user?.username || user?.email || "Guest User";
  const userInitials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col z-50 w-[280px] transition-transform duration-500 ease-in-out",
        "bg-sidebar backdrop-blur-xl border-r border-sidebar-border shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="relative h-[80px] flex items-center px-5 mb-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-sidebar-foreground leading-none">Aura Finance</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Smart AI Engine</span>
          </div>
        </div>

        {/* Close Button for Mobile (Top Trailing) */}
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

      {/* Navigation section */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto no-scrollbar py-4">
        <div>
          <p className="px-3 mb-4 text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em]">Menu</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-300",
                    isActive ? "text-primary" : "group-hover:text-sidebar-foreground"
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <span className={cn(
                    "font-semibold text-sm transition-all duration-300",
                    isActive ? "translate-x-0.5" : "group-hover:translate-x-1"
                  )}>
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 mt-auto border-t border-sidebar-border/50">
        <div className="rounded-2xl bg-sidebar-accent/30 p-3 border border-sidebar-border/50 shadow-sm transition-all duration-500">
          {user && (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none group">
                    <Avatar className="transition-transform duration-300 group-hover:scale-105 border-2 border-white shadow-sm w-10 h-10 !bg-white">
                      <AvatarFallback className="!bg-white !text-slate-900 font-black text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56 p-2 rounded-xl shadow-2xl border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <DropdownMenuLabel className="font-bold flex items-center gap-2">
                    <User size={16} /> My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem className="rounded-lg cursor-pointer py-2 font-medium focus:bg-sidebar-accent">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>Security Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer py-2 font-medium text-red-400 focus:text-red-400 focus:bg-red-400/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-sidebar-foreground truncate leading-none mb-1">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Online</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-40 p-1 rounded-lg bg-sidebar border-sidebar-border">
                  <DropdownMenuItem onClick={logout} className="text-red-400 font-bold text-xs uppercase tracking-wider rounded-md focus:bg-red-400/10">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
