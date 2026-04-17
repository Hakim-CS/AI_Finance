import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Palette, Bell, Shield, CreditCard, Globe,
  Save, LogOut, Trash2, Moon, Sun,
  Monitor, Loader2, Check, Eye, EyeOff, AlertTriangle, Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePreferences, CURRENCIES, LANGUAGES } from "@/context/PreferencesContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarCropper } from "@/components/profile/AvatarCropper";

// ─── Schemas ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  username: z.string().min(3, "Min 3 characters").max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  phone: z.string().max(20).optional().or(z.literal("")),
  income: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Must be ≥ 0"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Enter current password"),
  newPassword: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

// ─── Local types (only used within this file) ────────────────────────────────
// Note: Preferences state is managed globally by PreferencesContext.
// These schemas are only for the form validation shapes.

const API = "http://localhost:5001";

async function apiFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Settings() {
  const { user, token, updateUser, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { prefs, setPrefs, savePrefs, isLoading: prefsLoading } = usePreferences();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [prefsSaving, setPrefsSaving] = useState(false);

  const handleSavePrefs = async () => {
    if (!token) return;
    setPrefsSaving(true);
    try {
      await savePrefs(token);
      toast({ title: "Preferences saved", description: "Your settings have been updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPrefsSaving(false);
    }
  };

  // Unified helper: updates global PreferencesContext + applies theme via next-themes
  const updatePref = <K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) => {
    setPrefs({ [key]: value });
    if (key === "theme") setTheme(value as string);
  };

  const userInitial = (user?.name || user?.username || user?.email || "U")[0].toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, preferences and security.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm"><User className="w-3.5 h-3.5" />{t('settings.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm"><Palette className="w-3.5 h-3.5" />{t('settings.tabs.appearance')}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm"><Bell className="w-3.5 h-3.5" />{t('settings.tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm"><Shield className="w-3.5 h-3.5" />{t('settings.tabs.security')}</TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="space-y-5">
          <ProfileTab
            user={user} token={token} updateUser={updateUser} toast={toast}
            userInitial={userInitial} prefs={prefs} updatePref={updatePref}
            onSavePrefs={handleSavePrefs} isSavingPrefs={prefsSaving}
          />
        </TabsContent>

        {/* ── APPEARANCE TAB ── */}
        <TabsContent value="appearance" className="space-y-5">
          <AppearanceTab
            theme={theme} prefs={prefs} updatePref={updatePref}
            onSave={handleSavePrefs} isSaving={prefsSaving} isLoading={prefsLoading}
          />
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications" className="space-y-5">
          <NotificationsTab
            prefs={prefs} updatePref={updatePref}
            onSave={handleSavePrefs} isSaving={prefsSaving} isLoading={prefsLoading}
          />
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security" className="space-y-5">
          <SecurityTab
            token={token} toast={toast} logout={logout}
            queryClient={queryClient}
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="pt-6 pb-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Designed &amp; built by{" "}
          <a href="https://github.com/Hakim-CS" target="_blank" rel="noopener noreferrer"
            className="text-foreground hover:text-primary font-bold underline underline-offset-4 decoration-primary/30 transition-colors">
            Hakim Nazari
          </a>
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50 mt-1">
          Bachelor Thesis · Computer Engineering
        </p>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ user, token, updateUser, toast, userInitial, prefs, updatePref, onSavePrefs, isSavingPrefs }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { formatAmount } = usePreferences();

  // ── Cropper state ────────────────────────────────────────────────────────
  const [cropSrc, setCropSrc] = useState<string>("");  // object URL open in cropper

  const [incomeDisplay, setIncomeDisplay] = useState(
    user?.income ? Number(user.income).toLocaleString("en-US") : ""
  );

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      phone: user?.phone || "",
      income: user?.income?.toString() || "0",
    },
  });

  // Sync display value when user data loads from context
  useEffect(() => {
    form.reset({
      name: user?.name || "",
      username: user?.username || "",
      phone: user?.phone || "",
      income: user?.income?.toString() || "0",
    });
    setIncomeDisplay(user?.income ? Number(user.income).toLocaleString("en-US") : "");
  }, [user]);

  const onSubmit = async (values: ProfileValues) => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await apiFetch("/auth/user", token, {
        method: "PUT",
        body: JSON.stringify({
          name: values.name,
          username: values.username,
          phone: values.phone || null,
          income: parseFloat(values.income),
        }),
      });
      updateUser({ ...user!, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const incomeVal = Number(user?.income) || 0;

  // ── Step 1: file chosen → open cropper modal ───────────────────────────────
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke any previous object URL to avoid memory leaks
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
    // Reset the input so the same file can be re-selected later
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // ── Step 2: cropped blob → POST to backend ───────────────────────────────
  const handleCropComplete = async (blob: Blob) => {
    setCropSrc("");                         // close the cropper
    if (!token) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");  // filename hint for multer

      const res = await fetch("http://localhost:5001/auth/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,       // browser auto-sets correct multipart Content-Type
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      updateUser({ ...user, avatar_url: data.avatar_url });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      {/* Identity card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription>Update your name, username, and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar row with upload + crop */}
          <div className="flex items-center gap-4">

            {/* Cropper modal — shown when a file has been selected */}
            {cropSrc && (
              <AvatarCropper
                imageSrc={cropSrc}
                onCropComplete={handleCropComplete}
                onClose={() => { URL.revokeObjectURL(cropSrc); setCropSrc(""); }}
              />
            )}

            {/* Hidden file input — triggers cropper */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />

            {/* Clickable avatar circle */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change photo"
            >
              <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                <AvatarImage
                  src={user?.avatar_url || ""}
                  alt={user?.name || "avatar"}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-black gradient-primary text-white select-none">
                  {isUploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin" /> : userInitial}
                </AvatarFallback>
              </Avatar>
              {/* Camera icon overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <p className="font-bold text-foreground">{user?.name || user?.username || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-primary hover:underline mt-1 font-medium"
              >
                {user?.avatar_url ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
          </div>

          <Separator />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Hakim Nazari" className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                          <Input placeholder="hakim_cs" className="h-10 rounded-xl pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+90 555 123 4567" className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input value={user?.email || ""} disabled
                    className="h-10 rounded-xl bg-muted/50 cursor-not-allowed opacity-60" />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed after registration.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}
                  className={cn("h-10 px-5 rounded-xl font-bold transition-all",
                    saved ? "bg-green-500 hover:bg-green-500" : "gradient-primary hover:opacity-90")}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                    : saved ? <><Check className="mr-2 h-4 w-4" />Saved!</>
                      : <><Save className="mr-2 h-4 w-4" />Save Profile</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Regional + Income */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Financial &amp; Regional Settings</CardTitle>
          <CardDescription>Set your monthly income, preferred currency, and language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Income stats — uses PreferencesContext formatAmount so currency updates instantly */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Monthly Income",     value: formatAmount(incomeVal) },
              { label: "Savings Target 20%", value: formatAmount(Math.round(incomeVal * 0.20)) },
              { label: "Daily Budget",       value: formatAmount(Math.round(incomeVal / 30)) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 border border-border rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-lg font-black text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField control={form.control} name="income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Monthly Income ({CURRENCIES[prefs.currency]?.symbol ?? '₺'})
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold select-none">
                          {CURRENCIES[prefs.currency]?.symbol ?? '₺'}
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={incomeDisplay}
                          placeholder="50,000"
                          className="h-10 rounded-xl pl-7 font-bold"
                          onChange={(e) => {
                            // Strip everything except digits and one decimal point
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            // Reformat with commas on the integer part
                            const parts = raw.split(".");
                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            const formatted = parts.slice(0, 2).join(".");
                            setIncomeDisplay(formatted);
                            // Store the clean numeric string into react-hook-form for validation
                            field.onChange(raw);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Currency + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5" /> Currency
              </Label>
              <Select value={prefs.currency} onValueChange={v => updatePref("currency", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">₺ Turkish Lira (TRY)</SelectItem>
                  <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Globe className="w-3.5 h-3.5" /> Language
              </Label>
              <Select value={prefs.language} onValueChange={v => updatePref("language", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save button — persists currency + language to UserPreferences table */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Currency and language apply instantly and are saved to your account.
            </p>
            <Button
              type="button"
              onClick={onSavePrefs}
              disabled={isSavingPrefs}
              className="h-9 px-4 rounded-xl font-bold gradient-primary hover:opacity-90 text-sm"
            >
              {isSavingPrefs
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving...</>
                : <><Save className="mr-2 h-3.5 w-3.5" />Save Regional</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Appearance Tab ──────────────────────────────────────────────────────────

function AppearanceTab({ theme, prefs, updatePref, onSave, isSaving, isLoading }: any) {
  const THEMES = [
    { value: "light", label: "Light", icon: Sun, desc: "Clean & bright" },
    { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { value: "system", label: "System", icon: Monitor, desc: "Follows your OS" },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Display Preferences</CardTitle>
        <CardDescription>Choose your theme. Changes apply instantly and persist across sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading preferences…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEMES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => updatePref("theme", value)}
                className={cn(
                  "relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all duration-200",
                  (prefs.theme === value)
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                {prefs.theme === value && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                  prefs.theme === value ? "gradient-primary" : "bg-muted")}>
                  <Icon className={cn("w-5 h-5", prefs.theme === value ? "text-white" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("font-bold text-sm", prefs.theme === value ? "text-primary" : "text-foreground")}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving || isLoading}
            className="h-10 px-5 rounded-xl font-bold gradient-primary hover:opacity-90">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="mr-2 h-4 w-4" />Save Theme</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Tab ───────────────────────────────────────────────────────

const NOTIF_ITEMS: { key: string; title: string; desc: string }[] = [
  { key: "notif_email",         title: "Email Notifications", desc: "Receive updates and alerts via email" },
  { key: "notif_budget_alerts", title: "Budget Alerts",        desc: "Notify when spending approaches your limit" },
  { key: "notif_weekly_report", title: "Weekly Reports",       desc: "Get a weekly spending digest every Monday" },
  { key: "notif_ai_insights",   title: "AI Insights",          desc: "Receive AI-powered financial recommendations" },
];

function NotificationsTab({ prefs, updatePref, onSave, isSaving, isLoading }: any) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Notification Preferences</CardTitle>
        <CardDescription>Choose what you want to be alerted about. Saved to your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading preferences…
          </div>
        ) : (
          <>
            {NOTIF_ITEMS.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={Boolean(prefs[item.key])}
                    onCheckedChange={v => updatePref(item.key, v)}
                  />
                </div>
                {i < NOTIF_ITEMS.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={isSaving || isLoading}
            className="h-10 px-5 rounded-xl font-bold gradient-primary hover:opacity-90">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="mr-2 h-4 w-4" />Save Preferences</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────────────

function SecurityTab({ token, toast, logout, queryClient }: any) {
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPass = form.watch("newPassword");
  const strength = passwordStrength(newPass);

  const onSubmit = async (values: PasswordValues) => {
    if (!token) return;
    setIsSaving(true);
    try {
      await apiFetch("/auth/change-password", token, {
        method: "POST",
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      form.reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Password changed", description: "Your new password is active." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearExpenses = async () => {
    if (!token) return;
    setIsClearing(true);
    try {
      const data = await apiFetch("/expenses/all", token, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expenses cleared", description: data.message });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {/* Password change */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Verify your current password before setting a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-5">
            {["JWT Authentication", "Bcrypt hashing (10 rounds)", "7-day session"].map(b => (
              <Badge key={b} variant="outline" className="gap-1 border-green-500/30 text-green-600 bg-green-500/5 text-xs">
                <Check className="w-3 h-3" />{b}
              </Badge>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Current password */}
              <FormField control={form.control} name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showCur ? "text" : "password"}
                          placeholder="Enter your current password" className="h-10 rounded-xl pr-10" />
                        <button type="button" onClick={() => setShowCur(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* New password + strength */}
              <FormField control={form.control} name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showNew ? "text" : "password"}
                          placeholder="Min. 6 characters" className="h-10 rounded-xl pr-10" />
                        <button type="button" onClick={() => setShowNew(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    {newPass.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300",
                              i <= strength.score
                                ? strength.score === 1 ? "bg-red-500"
                                  : strength.score === 2 ? "bg-orange-500"
                                    : strength.score === 3 ? "bg-yellow-500"
                                      : "bg-green-500"
                                : "bg-muted")} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Strength: <span className="font-bold">{strength.label}</span></p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm password */}
              <FormField control={form.control} name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showCon ? "text" : "password"}
                          placeholder="Repeat your new password" className="h-10 rounded-xl pr-10" />
                        <button type="button" onClick={() => setShowCon(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={isSaving}
                  className={cn("h-10 px-5 rounded-xl font-bold transition-all",
                    saved ? "bg-green-500 hover:bg-green-500" : "gradient-primary hover:opacity-90")}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</>
                    : saved ? <><Check className="mr-2 h-4 w-4" />Changed!</>
                      : <><Shield className="mr-2 h-4 w-4" />Change Password</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible actions. Read carefully before proceeding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Sign out */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Sign Out</p>
              <p className="text-xs text-muted-foreground">End your current session. Data stays intact.</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="rounded-lg gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </div>

          <Separator />

          {/* Clear all personal expenses */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-destructive">Clear All Personal Expenses</p>
              <p className="text-xs text-muted-foreground">Delete every personal expense you've recorded. Group expenses are preserved.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isClearing} className="rounded-lg gap-1.5">
                  {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><Trash2 className="w-3.5 h-3.5" />Clear</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Confirm data deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will <strong>permanently delete all your personal expenses</strong>.
                    Budget limits and group data are not affected. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearExpenses}
                    className="bg-destructive hover:bg-destructive/90">
                    Yes, Delete All Expenses
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Password strength utility ───────────────────────────────────────────────

function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "None" };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return { score: Math.max(1, s), label: ["", "Weak", "Fair", "Good", "Strong"][Math.max(1, s)] };
}