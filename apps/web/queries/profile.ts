import { ProfileService } from '@/services';
import { ProfileInput } from '@repo/shared-types/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const profileKeys = {
  karmiPoints: () => ['karmiPoints'] as const,
};

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileInput) => ProfileService.createProfile(data),
    onSuccess: () => {
      toast.success('Profile created successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create profile');
    },
  });
}

export function useGetKarmiPoints() {
  return useQuery({
    queryKey: profileKeys.karmiPoints(),
    queryFn: () => ProfileService.getKarmiPoints(),
  });
}
