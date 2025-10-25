import { ProfileService } from '@/services';
import { ProfileInput } from '@repo/shared-types/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

export const profileKeys = {
  profile: () => ['profile'] as const,
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

export function useGetProfile() {
  return useQuery({
    queryKey: profileKeys.profile(),
    queryFn: () => ProfileService.getUserProfile(),
  });
}

export function useGetKarmiPoints() {
  return useQuery({
    queryKey: profileKeys.karmiPoints(),
    queryFn: () => ProfileService.getKarmiPoints(),
  });
}

export function useDeleteUserProfile() {
  return useMutation({
    mutationFn: () => ProfileService.deleteUserProfile(),
    onSuccess: () => {
      toast.success('User profile deleted successfully');
      signOut({
        callbackUrl: '/auth/login',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user profile');
    },
  });
}
