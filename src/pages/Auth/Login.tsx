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
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
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
      await login(values.email, values.password);
      toast({
        title: t("auth.welcomeBack", { defaultValue: "Welcome back!" }),
        description: t("auth.loginSuccess", { defaultValue: "Successfully logged into your account." }),
      });
    } catch (error: any) {
      toast({
        title: t("auth.loginFailed", { defaultValue: "Login Failed" }),
        description: error.message || t("auth.checkCredentials", { defaultValue: "Please check your credentials." }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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
              {t("auth.heroTitle", { defaultValue: "Master your money with precision." })}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("auth.heroSubtitle", { defaultValue: "Experience the future of personal finance with real-time tracking, AI-powered insights, and seamless collaborative spending." })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-12">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <ShieldCheck className="w-6 h-6 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground">{t("auth.secureVault", { defaultValue: "Secure Vault" })}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("auth.secureVaultDesc", { defaultValue: "Bank-grade encryption for your data." })}</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <Sparkles className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="font-bold text-sm text-foreground">{t("auth.smartAnalysis", { defaultValue: "Smart Analysis" })}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("auth.smartAnalysisDesc", { defaultValue: "Automated category predictions." })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-3xl font-black text-foreground tracking-tight">
              {t("auth.signIn", { defaultValue: "Sign In" })}
            </h3>
            <p className="text-muted-foreground font-medium">
              {t("auth.signInDesc", { defaultValue: "Enter your credentials to manage your account." })}
            </p>
          </div>

          <Card className="border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20 bg-card/80 backdrop-blur-xl">
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {t("auth.email", { defaultValue: "Email Address" })}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="name@example.com" 
                            className="h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-all rounded-xl font-medium" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t("auth.password", { defaultValue: "Password" })}
                          </FormLabel>
                          <Button variant="link" className="text-xs p-0 h-auto font-bold text-primary" type="button">
                            {t("auth.forgot", { defaultValue: "Forgot?" })}
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            className="h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/50 focus:bg-background transition-all rounded-xl font-medium" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl gradient-primary text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.verifying", { defaultValue: "Verifying..." })}
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t("auth.signIn", { defaultValue: "Sign In" })} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-sm font-bold text-muted-foreground">
            {t("auth.noAccount", { defaultValue: "Don't have an account?" })}{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
              {t("auth.createAccount", { defaultValue: "Create an account" })}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
