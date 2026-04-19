import { API_BASE } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Palette, Bell, Shield, CreditCard, Globe,
  Save, LogOut, Trash2, Moon, Sun,
  Monitor, Loader2, Check, Eye, EyeOff, AlertTriangle, Camera, RotateCcw,
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

const API = API_BASE;

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
  const { user, token, updateUser, logout, deletionDate, clearDeletionState } = useAuth();
  const { setTheme } = useTheme();
  const { prefs, setPrefs, savePrefs, isLoading: prefsLoading, registerThemeSetter } = usePreferences();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Register next-themes driver once — PreferencesContext will call setTheme
  // whenever prefs.theme changes (from DB, localStorage, or user selection)
  useEffect(() => {
    registerThemeSetter(setTheme);
  }, [registerThemeSetter, setTheme]);

  const handleSavePrefs = async () => {
    if (!token) return;
    setPrefsSaving(true);
    try {
      await savePrefs(token);
      toast({ title: t('settings.toasts.preferencesSaved'), description: t('settings.toasts.preferencesSavedDesc') });
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    } finally {
      setPrefsSaving(false);
    }
  };

  // updatePref: update context state (triggers theme/language side-effects automatically)
  const updatePref = <K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) => {
    setPrefs({ [key]: value } as Partial<typeof prefs>);
  };

  const userInitial = (user?.name || user?.username || user?.email || "U")[0].toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
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
            prefs={prefs} updatePref={updatePref}
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
            deletionDate={deletionDate}
            clearDeletionState={clearDeletionState}
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
  const { t } = useTranslation();

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
      toast({ title: t('settings.profile.profileUpdated'), description: t('settings.profile.profileUpdatedDesc') });
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

      const res = await fetch(`${API_BASE}/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,       // browser auto-sets correct multipart Content-Type
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      updateUser({ ...user, avatar_url: data.avatar_url });
      toast({ title: t('settings.profile.photoUpdated'), description: t('settings.profile.photoUpdatedDesc') });
    } catch (err: any) {
      toast({ title: t('settings.profile.photoFailed'), description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <>
      {/* Identity card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t('settings.profile.title')}</CardTitle>
          <CardDescription>{t('settings.profile.description')}</CardDescription>
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
                {user?.avatar_url ? t('settings.profile.changePhoto') : t('settings.profile.uploadPhoto')}
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.profile.fullName')}</FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.profile.username')}</FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.profile.phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+90 555 123 4567" className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.profile.email')}</Label>
                  <Input value={user?.email || ""} disabled
                    className="h-10 rounded-xl bg-muted/50 cursor-not-allowed opacity-60" />
                  <p className="text-[10px] text-muted-foreground">{t('settings.profile.emailHint')}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}
                  className={cn("h-10 px-5 rounded-xl font-bold transition-all",
                    saved ? "bg-green-500 hover:bg-green-500" : "gradient-primary hover:opacity-90")}>
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('settings.profile.saving')}</>
                    : saved ? <><Check className="mr-2 h-4 w-4" />{t('settings.profile.saved')}</>
                      : <><Save className="mr-2 h-4 w-4" />{t('settings.profile.saveProfile')}</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Regional + Income */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t('settings.profile.regional')}</CardTitle>
          <CardDescription>{t('settings.profile.regionalDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Income stats — uses PreferencesContext formatAmount so currency updates instantly */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('settings.profile.monthlyIncome'), value: formatAmount(incomeVal) },
              { label: t('settings.profile.savingsTarget'), value: formatAmount(Math.round(incomeVal * 0.20)) },
              { label: t('settings.profile.dailyBudget'), value: formatAmount(Math.round(incomeVal / 30)) },
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
                      {t('settings.profile.monthlyIncome')} ({CURRENCIES[prefs.currency]?.symbol ?? '₺'})
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
                <CreditCard className="w-3.5 h-3.5" /> {t('settings.profile.currency')}
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
                <Globe className="w-3.5 h-3.5" /> {t('settings.profile.language')}
              </Label>
              <Select value={prefs.language} onValueChange={v => updatePref("language", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr" style={{display:'none'}} aria-hidden>Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save button — persists currency + language to UserPreferences table */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {t('settings.profile.regionalHint')}
            </p>
            <Button
              type="button"
              onClick={onSavePrefs}
              disabled={isSavingPrefs}
              className="h-9 px-4 rounded-xl font-bold gradient-primary hover:opacity-90 text-sm"
            >
              {isSavingPrefs
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t('common.saving')}</>
                : <><Save className="mr-2 h-3.5 w-3.5" />{t('settings.profile.saveRegional')}</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ─── Appearance Tab ──────────────────────────────────────────────────────────

function AppearanceTab({ prefs, updatePref, onSave, isSaving, isLoading }: any) {
  const { t } = useTranslation();
  const THEMES = [
    { value: "light", label: t('settings.appearance.light'), icon: Sun, desc: t('settings.appearance.light_desc') },
    { value: "dark", label: t('settings.appearance.dark'), icon: Moon, desc: t('settings.appearance.dark_desc') },
    { value: "system", label: t('settings.appearance.system'), icon: Monitor, desc: t('settings.appearance.system_desc') },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t('settings.appearance.title')}</CardTitle>
        <CardDescription>{t('settings.appearance.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
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
            {isSaving
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</>
              : <><Save className="mr-2 h-4 w-4" />{t('settings.appearance.save')}</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Tab ───────────────────────────────────────────────────────

function NotificationsTab({ prefs, updatePref, onSave, isSaving, isLoading }: any) {
  const { t } = useTranslation();

  const NOTIF_ITEMS = [
    { key: "notif_email", title: t('settings.notifications.email'), desc: t('settings.notifications.email_desc') },
    { key: "notif_budget_alerts", title: t('settings.notifications.budget_alerts'), desc: t('settings.notifications.budget_alerts_desc') },
    { key: "notif_weekly_report", title: t('settings.notifications.weekly_report'), desc: t('settings.notifications.weekly_report_desc') },
    { key: "notif_ai_insights", title: t('settings.notifications.ai_insights'), desc: t('settings.notifications.ai_insights_desc') },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t('settings.notifications.title')}</CardTitle>
        <CardDescription>{t('settings.notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
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
            {isSaving
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('common.saving')}</>
              : <><Save className="mr-2 h-4 w-4" />{t('settings.notifications.save')}</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────────────

function SecurityTab({ token, toast, logout, queryClient, deletionDate, clearDeletionState }: any) {
  const { t } = useTranslation();
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
      toast({ title: t('settings.security.passwordChanged'), description: t('settings.security.passwordChangedDesc') });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Soft delete — sets deleted_at; user stays logged in to see the restoration option
  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsClearing(true);
    try {
      const data = await apiFetch("/auth/account", token, { method: "DELETE" });
      // data.deletion_date is the ISO date when the account will be permanently deleted
      toast({
        title: t('settings.security.deletionScheduled'),
        description: t('settings.security.deletionScheduledDesc'),
      });
      // Banner will appear automatically — AuthContext's deletionDate is updated on next render
      // by triggering a re-login or by directly updating it. Easiest: store in localStorage.
      localStorage.setItem("deletionDate", data.deletion_date);
      // Force AuthContext to pick it up by dispatching a storage event
      window.dispatchEvent(new StorageEvent("storage", { key: "deletionDate", newValue: data.deletion_date }));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  // Restore — clears deleted_at; called from the Security tab as an alternative to the banner
  const handleRestoreAccount = async () => {
    if (!token) return;
    setIsClearing(true);
    try {
      await apiFetch("/auth/account/restore", token, { method: "POST" });
      clearDeletionState?.();
      toast({ title: t('settings.security.restoreAccount'), description: t('settings.security.restoreAccountDesc') });
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
          <CardTitle className="text-base">{t('settings.security.changePassword')}</CardTitle>
          <CardDescription>{t('settings.security.changePasswordDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              t('settings.security.securityBadge1'),
              t('settings.security.securityBadge2'),
              t('settings.security.securityBadge3'),
            ].map(b => (
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.security.currentPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showCur ? "text" : "password"}
                          placeholder={t('settings.security.currentPasswordPlaceholder')} className="h-10 rounded-xl pr-10" />
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.security.newPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showNew ? "text" : "password"}
                          placeholder={t('settings.security.newPasswordPlaceholder')} className="h-10 rounded-xl pr-10" />
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
                        <p className="text-xs text-muted-foreground">{t('settings.security.passwordStrength')} <span className="font-bold">{strength.label}</span></p>
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.security.confirmPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showCon ? "text" : "password"}
                          placeholder={t('settings.security.confirmPasswordPlaceholder')} className="h-10 rounded-xl pr-10" />
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
                  {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('settings.security.updating')}</>
                    : saved ? <><Check className="mr-2 h-4 w-4" />{t('settings.security.changed')}</>
                      : <><Shield className="mr-2 h-4 w-4" />{t('settings.security.updatePassword')}</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className={deletionDate ? "border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10" : "border-destructive/30"}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${deletionDate ? "text-amber-500" : "text-destructive"}`} />
            <CardTitle className={`text-base ${deletionDate ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
              {deletionDate ? t('settings.security.dangerZoneActive') : t('settings.security.dangerZone')}
            </CardTitle>
          </div>
          <CardDescription>
            {deletionDate
              ? t('settings.security.dangerZoneActiveDesc')
              : t('settings.security.dangerZoneDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Sign out */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('settings.security.signOut')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.security.signOutDesc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="rounded-lg gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> {t('settings.security.signOut')}
            </Button>
          </div>

          <Separator />

          {deletionDate ? (
            /* ── Account is already scheduled for deletion: show restore UI ── */
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{t('settings.security.restoreAccount')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.security.restoreAccountDesc')}
                </p>
              </div>
              <Button
                size="sm"
                disabled={isClearing}
                onClick={handleRestoreAccount}
                className="rounded-lg gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isClearing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><RotateCcw className="w-3.5 h-3.5" /> {t('settings.security.restore')}</>}
              </Button>
            </div>
          ) : (
            /* ── Normal state: delete account ── */
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-destructive">{t('settings.security.deleteAccount')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.security.deleteAccountDesc')}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isClearing} className="rounded-lg gap-1.5">
                    {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><Trash2 className="w-3.5 h-3.5" />{t('settings.security.deleteAccount')}</>}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> {t('settings.security.deleteDialogTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">{t('settings.security.deleteDialogDesc1')}</span>
                      <span className="block text-destructive font-medium">{t('settings.security.deleteDialogDesc2')}</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90">
                      {t('settings.security.scheduleDeletion')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Password strength utility ────────────────────────────────────────────────

function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "None" };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return { score: Math.max(1, s), label: ["", "Weak", "Fair", "Good", "Strong"][Math.max(1, s)] };
}