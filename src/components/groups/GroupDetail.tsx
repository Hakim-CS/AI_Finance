import { API_BASE } from "@/lib/api";
import { useState, useMemo } from "react";
import { ArrowLeft, Plus, ArrowRight, Receipt, Loader2, TrendingUp, TrendingDown, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Group, calculateDebts, getMemberById, getUserBalance, getTotalGroupExpenses } from "@/data/groupsData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useCategories";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetail({ group, onBack }: GroupDetailProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseData, setExpenseExpenseData] = useState({
    amount: "",
    description: "",
    categoryId: "other",
    date: new Date().toISOString().split('T')[0]
  });

  const debts = useMemo(() => calculateDebts(group), [group]);
  const totalExpenses = getTotalGroupExpenses(group);
  const userBalance = user ? getUserBalance(group, user.id.toString()) : 0;

  const balanceData = useMemo(() => {
    return group.members.map(member => ({
      name: member.name,
      balance: getUserBalance(group, member.id.toString())
    })).sort((a, b) => a.balance - b.balance);
  }, [group]);

  const handleDeleteGroup = async () => {
    if (!group.id) {
      toast({ title: "Error", description: "Invalid group ID", variant: "destructive" });
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        let errorMessage = "Failed to delete group";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON
        }
        throw new Error(errorMessage);
      }

      toast({ title: "Group Deleted", description: "The group has been removed successfully." });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onBack();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    setIsAddingMember(true);
    try {
      const res = await fetch(`${API_BASE}/groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: memberEmail })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "User not found");
      }
      toast({ title: "Success", description: "Member added to group" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setMemberEmail("");
      setAddMemberOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseData.amount || !expenseData.description) return;
    setIsAddingExpense(true);
    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseData,
          amount: parseFloat(expenseData.amount),
          groupId: group.id
        })
      });
      if (!res.ok) throw new Error("Failed to add expense");
      toast({ title: "Success", description: "Group expense added" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setAddExpenseOpen(false);
      setExpenseExpenseData({
        amount: "",
        description: "",
        categoryId: "other",
        date: new Date().toISOString().split('T')[0]
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingExpense(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{group.name}</h2>
            <p className="text-sm text-muted-foreground font-medium">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Number(user?.id) === Number(group.createdBy) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold uppercase tracking-wider text-[10px] h-9 px-4">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the group <span className="font-bold text-slate-900">"{group.name}"</span> and remove all associated expense records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="bg-rose-600 hover:bg-rose-700 text-white">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="sm" className="gradient-primary h-9 px-4 font-bold uppercase tracking-wider text-[10px]" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Group Spending</p>
              <p className="text-2xl font-bold text-foreground">₺{totalExpenses.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members Involved</p>
              <p className="text-2xl font-bold text-foreground">{group.members.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              userBalance >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              {userBalance >= 0 ?
                <TrendingUp className="w-5 h-5 text-success" /> :
                <TrendingDown className="w-5 h-5 text-destructive" />
              }
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Net Balance</p>
              <p className={cn(
                "text-2xl font-bold",
                userBalance >= 0 ? "text-success" : "text-destructive"
              )}>
                {userBalance >= 0 ? "+" : ""}₺{Math.abs(userBalance).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settlement Strategy & Chart */}
        <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Settlement Overview
                </CardTitle>
                <CardDescription className="text-sm">Visualizing who owes and who is owed</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {debts.length === 0 ? "Fully Settled" : `${debts.length} Pending Payments`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Balance Chart */}
              <div className="md:col-span-3 h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={balanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
                      width={90}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value as number;
                          return (
                            <div className="bg-popover p-2 border border-border shadow-md rounded-lg text-xs">
                              <p className="font-bold text-foreground">{payload[0].payload.name}</p>
                              <p className={val >= 0 ? "text-success" : "text-destructive"}>
                                {val >= 0 ? "Is owed: " : "Owes: "} ₺{Math.abs(val).toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                    <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                      {balanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.balance >= 0 ? '#10b981' : '#ef4444'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Repayment List */}
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggested Payments</p>
                {debts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-xl">
                    <p className="text-sm font-medium text-muted-foreground">
                      🎉 Everyone is settled up!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                    {debts.map((debt, index) => {
                      const fromMember = getMemberById(group.members, debt.from.toString());
                      const toMember = getMemberById(group.members, debt.to.toString());
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card shadow-sm">
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <span className="font-bold text-[13px] text-foreground truncate">{fromMember?.name}</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">pays</span>
                            <span className="font-bold text-[13px] text-foreground truncate">{toMember?.name}</span>
                          </div>
                          <div className="ml-3 shrink-0">
                            <span className="text-[14px] font-black text-primary">₺{debt.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Members & Balances List */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.members.map((member) => {
                const balance = getUserBalance(group, member.id.toString());
                return (
                  <div key={member.id} className="flex items-center justify-between group/member">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 transition-transform group-hover/member:scale-110">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs px-2 py-0.5 h-6",
                        balance > 0 && "bg-success/10 text-success border-success/20",
                        balance < 0 && "bg-destructive/10 text-destructive border-destructive/20",
                        balance === 0 && "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {balance > 0 ? "+" : ""}{balance === 0 ? "Settled" : `₺${balance.toFixed(2)}`}
                    </Badge>
                  </div>
                );
              })}
              <Separator className="my-2" />
              <Button variant="outline" size="sm" className="w-full text-sm h-9" onClick={() => setAddMemberOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardContent>
          </Card>

          {/* Recent Expenses List */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Expenses
                </CardTitle>
                <Button size="sm" className="gradient-primary h-7 text-xs px-2" onClick={() => setAddExpenseOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.expenses.length === 0 ? (
                <div className="text-center py-6">
                  <Receipt className="w-9 h-9 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No expenses yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {group.expenses.slice().reverse().map((expense) => {
                    const paidByMember = getMemberById(group.members, expense.paidBy);
                    return (
                      <div key={expense.id} className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate flex-1">{expense.description}</p>
                          <p className="font-bold text-sm ml-2">₺{expense.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            By {paidByMember?.name || "Member"} • {format(new Date(expense.date), "MMM d")}
                          </p>
                          <Badge variant="outline" className="text-[9px] h-4.5 px-1 leading-none">
                            {expense.splitBetween.length} ppl
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a friend by their email address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                placeholder="friend@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Group Expense</DialogTitle>
            <DialogDescription>This expense will be split between all members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Dinner, Electricity, etc."
                value={expenseData.description}
                onChange={(e) => setExpenseExpenseData({ ...expenseData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">₺</span>
                <Input
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseExpenseData({ ...expenseData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={expenseData.categoryId}
                onValueChange={(v) => setExpenseExpenseData({ ...expenseData, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={isAddingExpense}>
              {isAddingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
