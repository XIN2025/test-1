import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services';
import { toast } from 'sonner';

export const chatKeys = {
  all: ['chat'] as const,
  config: () => ['config'] as const,
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

export const useChatConfig = () => {
  return useQuery({
    queryKey: chatKeys.config(),
    queryFn: () => ChatService.getChatConfig(),
  });
};

export const useUpdateChatConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: { prompt: string; model: 'openai' | 'gemini' }) => ChatService.updateChatConfig(config),
    onSuccess: () => {
      toast.success('Chat config updated successfully');
      queryClient.invalidateQueries({ queryKey: chatKeys.config() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
