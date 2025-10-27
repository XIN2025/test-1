import { ApiClient } from '@/lib/api-client';
import { ChatType } from '@repo/shared-types/types';

export class ChatService {
  static async createChat() {
    return await ApiClient.post<ChatType>('/api/agents/chat');
  }
}
