import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Camera,
  Save,
  LogOut,
  Trash2,
  ChevronRight,
  Moon,
  Sun,
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
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    phone: "+90 555 123 4567",
  });
  const [currency, setCurrency] = useState("TRY");
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    budgetAlerts: true,
    weeklyReport: true,
    aiInsights: true,
    billReminders: true,
  });

  const handleSaveProfile = () => {
    toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
  };

  const handleSaveNotifications = () => {
    toast({ title: "Notifications updated", description: "Your notification preferences have been saved." });
  };

  const handleSaveAppearance = () => {
    toast({ title: "Appearance updated", description: "Your display preferences have been saved." });
  };

  const handleDeleteAccount = () => {
    toast({ title: "Action required", description: "Please confirm account deletion via email.", variant: "destructive" });
  };

  const handleLogout = () => {
    toast({ title: "Logged out", description: "You have been logged out successfully." });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">AY</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="w-4 h-4" /> Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currency & Language */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regional Settings</CardTitle>
              <CardDescription>Set your preferred currency and language</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /> Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">₺ Turkish Lira (TRY)</SelectItem>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /> Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Display Preferences</CardTitle>
              <CardDescription>Customize how the app looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex gap-3">
                  {[
                    { name: "Green", class: "bg-primary" },
                    { name: "Blue", class: "bg-[hsl(210,80%,50%)]" },
                    { name: "Purple", class: "bg-[hsl(270,70%,55%)]" },
                    { name: "Orange", class: "bg-[hsl(25,90%,55%)]" },
                    { name: "Pink", class: "bg-[hsl(340,75%,55%)]" },
                  ].map((color) => (
                    <button
                      key={color.name}
                      className={`w-9 h-9 rounded-full ${color.class} ring-2 ring-offset-2 ring-offset-background ${color.name === "Green" ? "ring-primary" : "ring-transparent"} hover:scale-110 transition-transform`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Dashboard Layout</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Compact", "Comfortable"].map((layout) => (
                    <button
                      key={layout}
                      className={`p-4 rounded-lg border text-sm font-medium text-center transition-colors ${layout === "Comfortable" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance} className="gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "email" as const, title: "Email Notifications", desc: "Receive updates and alerts via email" },
                { key: "push" as const, title: "Push Notifications", desc: "Get real-time alerts on your device" },
                { key: "budgetAlerts" as const, title: "Budget Alerts", desc: "Notify when spending exceeds budget limits" },
                { key: "weeklyReport" as const, title: "Weekly Reports", desc: "Receive a weekly spending summary" },
                { key: "aiInsights" as const, title: "AI Insights", desc: "Get AI-powered financial recommendations" },
                { key: "billReminders" as const, title: "Bill Reminders", desc: "Reminders for upcoming bill payments" },
              ].map((item, index) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                  {index < 5 && <Separator className="mt-4" />}
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Password</CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="gap-2"><Save className="w-4 h-4" /> Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">2FA is disabled</p>
                    <p className="text-xs text-muted-foreground">Protect your account with two-factor authentication</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Enable <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Log out of all devices</p>
                  <p className="text-xs text-muted-foreground">Sign out from all active sessions</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" /> Log Out
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}