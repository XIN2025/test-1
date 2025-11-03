import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services';
import { toast } from 'sonner';

export const chatKeys = {
  all: ['chats'] as const,
  chat: (chatId: string) => [...chatKeys.all, chatId] as const,
  chats: () => [...chatKeys.all, 'list'] as const,
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ChatService.createChat(),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => ChatService.deleteChat(chatId),
    onSuccess: () => {
      toast.success('Chat deleted successfully');
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: { title?: string; isPublic?: boolean } }) =>
      ChatService.updateChat(chatId, body),
    onSuccess: (_, variables) => {
      toast.success('Chat updated successfully');
      queryClient.invalidateQueries({ queryKey: chatKeys.chat(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useGetChatById = (chatId: string) => {
  return useQuery({
    queryKey: chatKeys.chat(chatId),
    queryFn: () => ChatService.getChatById(chatId),
    enabled: !!chatId,
  });
};
