import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ModelMessage,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { fallbackPrompts } from 'src/agents/prompts';
import { ToolsService } from './tools.service';
import { Response } from 'express';
import { google } from '@ai-sdk/google';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatConfigService } from './chat-config.service';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { MessageDto } from './dto/chat-agent.dto';

const chatStore = new Map<string, ModelMessage[]>();

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

  async chat(chatId: string, message: MessageDto, user: RequestUser, res: Response) {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    const history = chatStore.get(chatId) || [];
    const systemMessage = history.find((msg) => msg.role === 'system');
    if (!systemMessage) {
      console.log('creating system message from user profile');
      const userProfile = await this.prisma.userProfile.findUnique({
        where: {
          userId: user.id,
        },
      });
      history.push({
        role: 'system',
        content: `User name: ${user.name}\n User Gender: ${userProfile?.gender}\n User DOB: ${userProfile?.dateOfBirth}\n User time of birth: ${userProfile?.timeOfBirth}\n User place of birth: ${userProfile?.placeOfBirth}\n User horoscope details: ${userProfile?.horoscopeDetails}`,
      });
    }
    history.push({
      role: 'user',
      content: message.content,
    });

    const model: any =
      this.chatConfigService.getChatConfig().model === 'openai' ? openai('gpt-4.1') : google('gemini-2.0-flash');

    pipeUIMessageStreamToResponse({
      response: res,
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          const result = streamText({
            model: model,
            system:
              this.chatConfigService.getChatConfig().chatAgentPrompt +
              '\n\nCurrent date and time in UTC: ' +
              new Date().toISOString(),
            messages: history,
            stopWhen: stepCountIs(10),
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              ...this.toolsService.getTools(),
            },
            temperature: 0.6,
            onStepFinish: async ({ finishReason }) => {
              console.log(finishReason);
            },
            onFinish: async ({ usage, text, finishReason }) => {
              console.log('onFinish called');
              console.log('usage', usage);
              console.log('finishReason', finishReason);

              history.push({
                role: 'assistant',
                content: text,
              });
              chatStore.set(chatId, history);
            },
          });

          writer.merge(result.toUIMessageStream());
        },
        onError: (error) => {
          console.log(error);
          return error instanceof Error ? error.message : String(error);
        },
      }),
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
