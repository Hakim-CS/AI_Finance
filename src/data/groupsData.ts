export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  date: string;
  category: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  createdAt: string;
  createdBy?: number;
}

export interface DebtCalculation {
  from: string;
  to: string;
  amount: number;
}

export const mockMembers: GroupMember[] = [
  { id: "user-1", name: "You", email: "you@example.com" },
  { id: "user-2", name: "Alex Chen", email: "alex@example.com" },
  { id: "user-3", name: "Sarah Miller", email: "sarah@example.com" },
  { id: "user-4", name: "Mike Johnson", email: "mike@example.com" },
  { id: "user-5", name: "Emma Wilson", email: "emma@example.com" },
];

export const mockGroups: Group[] = [
  {
    id: "group-1",
    name: "Roommates",
    description: "Monthly apartment expenses",
    members: [mockMembers[0], mockMembers[1], mockMembers[2]],
    expenses: [
      { id: "exp-1", description: "Electricity Bill", amount: 120, paidBy: "user-1", splitBetween: ["user-1", "user-2", "user-3"], date: "2024-12-10", category: "utilities" },
      { id: "exp-2", description: "Internet", amount: 60, paidBy: "user-2", splitBetween: ["user-1", "user-2", "user-3"], date: "2024-12-08", category: "utilities" },
      { id: "exp-3", description: "Groceries", amount: 85, paidBy: "user-3", splitBetween: ["user-1", "user-2", "user-3"], date: "2024-12-05", category: "food" },
    ],
    createdAt: "2024-01-15",
  },
  {
    id: "group-2",
    name: "Weekend Trip",
    description: "Beach vacation expenses",
    members: [mockMembers[0], mockMembers[3], mockMembers[4]],
    expenses: [
      { id: "exp-4", description: "Hotel Booking", amount: 450, paidBy: "user-4", splitBetween: ["user-1", "user-4", "user-5"], date: "2024-12-01", category: "travel" },
      { id: "exp-5", description: "Gas", amount: 80, paidBy: "user-1", splitBetween: ["user-1", "user-4", "user-5"], date: "2024-12-02", category: "transport" },
      { id: "exp-6", description: "Dinner", amount: 120, paidBy: "user-5", splitBetween: ["user-1", "user-4", "user-5"], date: "2024-12-02", category: "food" },
    ],
    createdAt: "2024-11-20",
  },
  {
    id: "group-3",
    name: "Office Lunch Club",
    description: "Weekly team lunches",
    members: [mockMembers[0], mockMembers[1], mockMembers[3], mockMembers[4]],
    expenses: [
      { id: "exp-7", description: "Pizza Friday", amount: 65, paidBy: "user-1", splitBetween: ["user-1", "user-2", "user-4", "user-5"], date: "2024-12-06", category: "food" },
      { id: "exp-8", description: "Sushi Lunch", amount: 95, paidBy: "user-5", splitBetween: ["user-1", "user-2", "user-4", "user-5"], date: "2024-12-09", category: "food" },
    ],
    createdAt: "2024-10-01",
  },
];

export function calculateDebts(group: Group): DebtCalculation[] {
  const balances: Record<string, number> = {};
  
  // Initialize balances
  group.members.forEach(member => {
    balances[member.id] = 0;
  });
  
  // Calculate balances based on expenses
  group.expenses.forEach(expense => {
    const amount = Number(expense.amount);
    const splitAmount = amount / expense.splitBetween.length;
    
    // Payer gets credited
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + amount;
    
    // Everyone who benefited gets debited
    expense.splitBetween.forEach(memberId => {
      balances[memberId] = (balances[memberId] || 0) - splitAmount;
    });
  });
  
  // Simplify debts
  const debts: DebtCalculation[] = [];
  const debtors = Object.entries(balances).filter(([, balance]) => balance < -0.01).sort((a, b) => a[1] - b[1]);
  const creditors = Object.entries(balances).filter(([, balance]) => balance > 0.01).sort((a, b) => b[1] - a[1]);
  
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debtorId, debtorBalance] = debtors[i];
    const [creditorId, creditorBalance] = creditors[j];
    
    const amount = Math.min(-debtorBalance, creditorBalance);
    
    if (amount > 0.01) {
      debts.push({
        from: debtorId,
        to: creditorId,
        amount: Math.round(amount * 100) / 100,
      });
    }
    
    debtors[i] = [debtorId, debtorBalance + amount];
    creditors[j] = [creditorId, creditorBalance - amount];
    
    if (Math.abs(debtors[i][1]) < 0.01) i++;
    if (Math.abs(creditors[j][1]) < 0.01) j++;
  }
  
  return debts;
}

export function getMemberById(members: (GroupMember | any)[], id: string | number): GroupMember | undefined {
  return members.find(m => m.id == id);
}

export function getTotalGroupExpenses(group: Group): number {
  return group.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
}

export function getUserBalance(group: Group, userId: string | number): number {
  let balance = 0;
  
  group.expenses.forEach(expense => {
    const amount = Number(expense.amount);
    const splitAmount = amount / expense.splitBetween.length;
    
    // Use loose equality to match IDs regardless of type (string/number)
    if (expense.paidBy == userId) {
      balance += amount;
    }
    
    if (expense.splitBetween.some(id => id == userId)) {
      balance -= splitAmount;
    }
  });
  
  return Math.round(balance * 100) / 100;
}
