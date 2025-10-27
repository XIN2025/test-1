import { ApiClient } from '@/lib/api-client';
import { ChatConfigType } from '@repo/shared-types/types';

export class AdminService {
  static async getChatConfig() {
    return await ApiClient.get<ChatConfigType>('/api/admin/chat-config');
  }

  static async updateChatConfig(config: Partial<ChatConfigType>) {
    return await ApiClient.put('/api/admin/chat-config', config);
  }
}
