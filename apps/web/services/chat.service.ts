import { ApiClient } from '@/lib/api-client';

export class ChatService {
  static async createChat() {
    return await ApiClient.post<{ id: string }>('/api/agents/chat');
  }
}
