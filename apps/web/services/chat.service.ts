import { ApiClient } from '@/lib/api-client';
import { ChatType } from '@repo/shared-types/types';

export class ChatService {
  static async createChat() {
    return await ApiClient.post<ChatType>('/api/agents/chat');
  }

  static async getChatById(chatId: string) {
    return await ApiClient.get<ChatType>(`/api/agents/chat/${chatId}`);
  }

  static async deleteChat(chatId: string) {
    return await ApiClient.delete(`/api/agents/chat/${chatId}`);
  }

  static async updateChat(chatId: string, body: { title: string }) {
    return await ApiClient.put(`/api/agents/chat/${chatId}`, body);
  }
}
