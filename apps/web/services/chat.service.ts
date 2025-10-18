import { ApiClient } from '@/lib/api-client';

export class ChatService {
  static async getChatConfig() {
    return await ApiClient.get<{ prompt: string; model: 'openai' | 'gemini' }>('/api/agents/config/chat');
  }

  static async updateChatConfig(config: { prompt: string; model: 'openai' | 'gemini' }) {
    return await ApiClient.put<boolean>('/api/agents/config/chat', config);
  }
}
