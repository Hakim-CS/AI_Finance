import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Wallet, ArrowRight, ShieldCheck, Sparkles, Sun, Moon, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  name: z.string().optional(),
  username: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      username: "",
    },
  });

  const langs = [
    { code: "en", label: "EN" },
    { code: "tr", label: "TR" },
    { code: "de", label: "DE" },
  ];

  const cycleLang = () => {
    const idx = langs.findIndex(l => l.code === i18n.language);
    const next = langs[(idx + 1) % langs.length];
    i18n.changeLanguage(next.code);
    localStorage.setItem("i18nextLng", next.code);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await register(values.email, values.password, values.name || undefined, values.username || undefined);
      toast({
        title: t("auth.accountCreated", { defaultValue: "Account Created!" }),
        description: t("auth.accountCreatedDesc", { defaultValue: "Your journey to financial clarity starts now." }),
      });
    } catch (error: any) {
      toast({
        title: t("auth.registrationFailed", { defaultValue: "Registration Failed" }),
        description: error.message || t("auth.unexpectedError", { defaultValue: "An unexpected error occurred." }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "h-11 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Top-right settings bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-muted"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-muted gap-1.5 px-3 text-xs font-bold"
          onClick={cycleLang}
        >
          <Globe className="h-3.5 w-3.5" />
          {langs.find(l => l.code === i18n.language)?.label || "EN"}
        </Button>
      </div>

      {/* Left Side: Branded Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted/30 items-center justify-center p-12 border-r border-border">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-md w-full space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-primary">Aura Finance</h1>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Next-Gen Intelligence</p>
            </div>
          </div>

          <div className="space-y-6 pt-8">
            <h2 className="text-5xl font-bold leading-tight text-foreground">
              {t("auth.signupHeroTitle", { defaultValue: "Start your path to prosperity." })}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("auth.signupHeroSubtitle", { defaultValue: "Join thousands of users who have transformed their relationship with money using our intuitive platform." })}
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-primary/5 transition-colors shadow-sm">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("auth.privacyPriority", { defaultValue: "Your privacy is our #1 priority." })}
              </p>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-emerald-400/5 transition-colors shadow-sm">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("auth.automationSavesTime", { defaultValue: "Intelligent automation saves you time." })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[480px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 py-12">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-3xl font-black text-foreground tracking-tight">
              {t("auth.createAccountTitle", { defaultValue: "Create Account" })}
            </h3>
            <p className="text-muted-foreground font-medium">
              {t("auth.createAccountDesc", { defaultValue: "Join Aura Finance and take control today." })}
            </p>
          </div>

          <Card className="border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20 bg-card/80 backdrop-blur-xl">
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t("auth.fullName", { defaultValue: "Full Name" })}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t("auth.username", { defaultValue: "Username" })}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {t("auth.email", { defaultValue: "Email Address" })}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" className={inputClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t("auth.password", { defaultValue: "Password" })}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t("auth.confirm", { defaultValue: "Confirm" })}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 mt-4 rounded-xl gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.creatingAccount", { defaultValue: "Creating Account..." })}
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t("auth.getStarted", { defaultValue: "Get Started" })} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm font-bold text-muted-foreground pb-8">
            {t("auth.hasAccount", { defaultValue: "Already have an account?" })}{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
              {t("auth.signIn", { defaultValue: "Sign In" })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
