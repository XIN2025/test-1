import { Injectable } from '@nestjs/common';
import {
  appendClientMessage,
  appendResponseMessages,
  Message,
  pipeDataStreamToResponse,
  smoothStream,
  streamText,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { chatAgentPrompt } from '../prompts/chat-agent';
import { ToolsService } from './tools.service';
import { Response } from 'express';

const sessionStore = new Map<string, Message[]>();

@Injectable()
export class AgentsService {
  constructor(private readonly toolsService: ToolsService) {}
  async chat(sessionId: string, message: Message, res: Response): Promise<void> {
    const history = sessionStore.get(sessionId) || [];
    history.push(message);

    const messages = appendClientMessage({
      messages: history,
      message,
    });

    pipeDataStreamToResponse(res, {
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4.1'),
          system: chatAgentPrompt(),
          messages: messages,
          maxSteps: 10,
          tools: this.toolsService.getTools(),
          toolCallStreaming: true,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onFinish: async ({ response }) => {
            const [, assistantMessage] = appendResponseMessages({
              messages: [message],
              responseMessages: response.messages,
            });
            history.push(assistantMessage);
            sessionStore.set(sessionId, history);
          },
          temperature: 0.6,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        console.log('error', error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  }

  getSessionMessages(sessionId: string) {
    return sessionStore.get(sessionId) || [];
  }

  clearSession(sessionId: string) {
    sessionStore.delete(sessionId);
  }
}
