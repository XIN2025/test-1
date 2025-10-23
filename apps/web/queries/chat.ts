import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services';
import { toast } from 'sonner';

export const chatKeys = {
  all: ['chat'] as const,
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ChatService.createChat(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
