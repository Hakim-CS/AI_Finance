import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface BudgetLimit {
  categoryId: string;
  limitAmount: string | number;
}

const fetchBudget = async (token: string | null): Promise<BudgetLimit[]> => {
  if (!token) return [];
  const response = await fetch('http://localhost:5001/budget', {
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
