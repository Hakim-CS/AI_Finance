import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string; // Renamed from 'category' to 'categoryId' to match backend
  description: string;
  date: string; // ISO string
  notes?: string;
  userId: number;
}

const fetchExpenses = async (token: string | null): Promise<Expense[]> => {
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('http://127.0.0.1:5001/expenses', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch expenses');
  }

  return response.json();
};

export const useExpenses = () => {
  const { token } = useAuth();
  return useQuery<Expense[], Error>({
    queryKey: ['expenses'],
    queryFn: () => fetchExpenses(token),
    enabled: !!token, // Only fetch if a token exists
  });
};
