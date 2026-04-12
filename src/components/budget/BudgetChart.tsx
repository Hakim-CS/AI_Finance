import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { BudgetCategory, formatCurrency } from "@/data/budgetData";

interface BudgetChartProps {
  categories: BudgetCategory[];
}

export function BudgetChart({ categories }: BudgetChartProps) {
  const data = categories.map(cat => ({
    name: cat.name.split(' ')[0],
    budget: cat.allocated,
    spent: cat.spent,
    color: cat.color,
  }));

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800">Budget vs Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                dy={15}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `₺${value / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                formatter={(value: number) => `₺${value.toLocaleString()}`}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="rect"
                iconSize={14}
                wrapperStyle={{ paddingTop: '30px', fontWeight: 600, fontSize: '14px', color: '#475569' }}
              />
              <Bar 
                dataKey="budget" 
                name="Budget" 
                fill="#64748b" 
                radius={[4, 4, 0, 0]} 
                barSize={24}
              />
              <Bar 
                dataKey="spent" 
                name="Spent" 
                radius={[4, 4, 0, 0]} 
                barSize={24}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
