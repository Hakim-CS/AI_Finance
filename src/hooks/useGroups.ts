import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface GroupMember {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string | number;
  splitBetween: (string | number)[];
  date: string;
  category: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: number;
  createdAt: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

const fetchGroups = async (token: string | null): Promise<Group[]> => {
  if (!token) return [];
  const response = await fetch('http://localhost:5001/groups', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
};

export const useGroups = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery<Group[], Error>({
    queryKey: ['groups', token],
    queryFn: () => fetchGroups(token),
    enabled: !!token,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (newGroup: { name: string; description: string; memberEmails: string[] }) => {
      const response = await fetch('http://localhost:5001/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    isError: groupsQuery.isError,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending
  };
};
