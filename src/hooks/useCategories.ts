import { useQuery } from '@tanstack/react-query';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('http://localhost:5001/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};
