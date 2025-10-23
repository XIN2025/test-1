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
import { fallbackPrompts } from 'src/agents/prompts';
import { ToolsService } from './tools.service';
import { Response } from 'express';
import { google } from '@ai-sdk/google';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatConfigService } from './chat-config.service';

const chatStore = new Map<string, Message[]>();

@Injectable()
export class AgentsService {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly prisma: PrismaService,
    private readonly chatConfigService: ChatConfigService
  ) {}

  async loadChatConfigFromDb() {
    const chatConfig = await this.prisma.chatConfig.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1,
    });
    return chatConfig;
  }

  async onModuleInit() {
    const config = await this.loadChatConfigFromDb();
    this.chatConfigService.setChatConfig(
      config || {
        id: '',
        model: 'openai',
        chatAgentPrompt: fallbackPrompts.getChatAgentPrompt(),
        webSearchPrompt: fallbackPrompts.getWebSearchPrompt(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  async createChat(userId: string) {
    console.log('createChat', userId);
    const chatId = Math.random().toString(36).substring(2, 15);
    chatStore.set(chatId, []);
    return { id: chatId };
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

    const model =
      this.chatConfigService.getChatConfig().model === 'openai'
        ? openai('gpt-4.1')
        : google('gemini-2.0-flash', {
            useSearchGrounding: true,
          });

    pipeDataStreamToResponse(res, {
      execute: (dataStream) => {
        const result = streamText({
          model: model,
          system: this.chatConfigService.getChatConfig().chatAgentPrompt,
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
