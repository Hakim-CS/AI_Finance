import { API_BASE } from "@/lib/api";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface BudgetLimit {
  categoryId: string;
  limitAmount: string | number;
}

const fetchBudget = async (token: string | null): Promise<BudgetLimit[]> => {
  if (!token) return [];
  const response = await fetch(`${API_BASE}/budget`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  return response.json();
};

export const useBudget = () => {
  const { token } = useAuth();
  return useQuery<BudgetLimit[], Error>({
    queryKey: ['budget', token],
    queryFn: () => fetchBudget(token),
    enabled: !!token,
  });
};
