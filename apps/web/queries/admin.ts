import { AdminService } from '@/services';
import { ChatConfigType } from '@repo/shared-types/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const adminKeys = {
  all: ['admin'] as const,
  chatConfig: () => ['chatConfig'] as const,
  users: () => ['users'] as const,
};

export const useGetChatConfig = () => {
  return useQuery({
    queryKey: adminKeys.chatConfig(),
    queryFn: () => AdminService.getChatConfig(),
  });
};

export const useUpdateChatConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<ChatConfigType>) => AdminService.updateChatConfig(config),
    onSuccess: () => {
      toast.success('Chat config updated successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.chatConfig() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useGetUsers = () => {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => AdminService.getUsers(),
  });
};
