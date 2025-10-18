import { Injectable, NotFoundException } from '@nestjs/common';
import {
  appendClientMessage,
  appendResponseMessages,
  Message,
  pipeDataStreamToResponse,
  smoothStream,
  streamText,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { prompts } from 'src/prompts';
import { ToolsService } from './tools.service';
import { Response } from 'express';

const chatStore = new Map<string, Message[]>();

@Injectable()
export class AgentsService {
  constructor(private readonly toolsService: ToolsService) {}

  async createChat(userId: string) {
    console.log('createChat', userId);
    const chatId = Math.random().toString(36).substring(2, 15);
    chatStore.set(chatId, []);
    return chatId;
  }

  async chat(chatId: string, message: Message, res: Response): Promise<void> {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    const history = chatStore.get(chatId) || [];
    history.push(message);

    const messages = appendClientMessage({
      messages: history,
      message,
    });

    pipeDataStreamToResponse(res, {
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4.1'),
          system: prompts.getChatAgentPrompt(),
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
            chatStore.set(chatId, history);
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

  getChatMessages(chatId: string) {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    return chatStore.get(chatId) || [];
  }

  deleteChat(chatId: string) {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    chatStore.delete(chatId);
    return true;
  }
}
