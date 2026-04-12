import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // Close sidebar by default on mobile, open on desktop
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen w-full bg-background flex overflow-hidden">
      {/* Mobile Toggle Button */}
      {isMobile && !isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl h-10 w-10 flex items-center justify-center"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[45] animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => isMobile && setIsSidebarOpen(false)} />
      
      <main className={cn(
        "min-h-screen flex-1 transition-all duration-500 ease-in-out bg-slate-50/30 overflow-y-auto",
        !isMobile && isSidebarOpen ? "ml-[280px]" : "ml-0"
      )}>
        <div className={cn(
          "p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in",
          isMobile && "pt-20" // Add space for the mobile menu button
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
