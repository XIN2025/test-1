import { Injectable } from '@nestjs/common';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chatAgentPrompt } from '../prompts/chat-agent';

const sessionStore = new Map<string, { role: 'user' | 'assistant'; content: string }[]>();

@Injectable()
export class AgentsService {
  async chat(sessionId: string, query: string): Promise<string> {
    const history = sessionStore.get(sessionId) || [];
    history.push({ role: 'user', content: query });

    const result = streamText({
      model: openai('gpt-4.1'),
      system: chatAgentPrompt(),
      messages: history,
    });

    let assistantReply = '';
    for await (const delta of result.textStream) {
      assistantReply += String(delta);
    }
    history.push({ role: 'assistant', content: assistantReply });
    sessionStore.set(sessionId, history);

    return assistantReply;
  }

  getSessionMessages(sessionId: string) {
    return sessionStore.get(sessionId) || [];
  }

  clearSession(sessionId: string) {
    sessionStore.delete(sessionId);
  }
}
