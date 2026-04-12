import { Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom"; // Import Link
import { Button } from "@/components/ui/button"; // Import Button

export default function Settings() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex flex-col items-start p-6">
            <SettingsIcon className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">General Settings</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Access your profile details and account information.
            </p>
            <Button asChild variant="outline">
              <Link to="/settings/profile">View Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-start p-6">
            <SettingsIcon className="w-8 h-8 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Currency selection, theme toggle, and notification preferences will be available in the next update.
            </p>
            <Button variant="outline" disabled>More Options</Button>
          </CardContent>
        </Card>
      </div>

      <div className="pt-20 pb-12 text-center">
        <div className="inline-flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            Designed & Engineered by
            <a 
              href="https://github.com/Hakim-CS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-bold underline decoration-primary/30 underline-offset-4"
            >
              Hakim Nazari & Ahmad Khaled Samim
            </a>
          </p>
          <div className="h-px w-8 bg-border" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60">
          Bachelor Thesis in Computer Engineering
          </p>
        </div>
      </div>
    </div>
  );
}