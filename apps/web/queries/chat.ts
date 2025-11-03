import { useMutation } from '@tanstack/react-query';
import { ChatService } from '@/services';
import { toast } from 'sonner';

export const chatKeys = {
  all: ['chats'] as const,
};

export const useCreateChat = () => {
  return useMutation({
    mutationFn: () => ChatService.createChat(),
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteChat = () => {
  return useMutation({
    mutationFn: (chatId: string) => ChatService.deleteChat(chatId),
    onSuccess: () => {
      toast.success('Chat deleted successfully');
    },
  });
};

export const useUpdateChat = () => {
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: { title?: string; isPublic?: boolean } }) =>
      ChatService.updateChat(chatId, body),
    onSuccess: () => {
      toast.success('Chat updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
