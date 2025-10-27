import { Injectable, NotFoundException } from '@nestjs/common';
import {
  createUIMessageStream,
  generateObject,
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
import { ChatConfigService } from '../admin/chat-config/chat-config.service';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { GetChatsQueryDto, MessageDto, UpdateChatDto } from './dto/chat-agent.dto';
import z from 'zod';
import { dbToModelMessage, dbToUIMessage } from './dto/db-message.dto';
import { InputJsonValue } from '@repo/db/generated/prisma/runtime/library';
import { ChatConfig, UserProfile } from '@repo/db';

@Injectable()
export class AgentsService {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly prisma: PrismaService,
    private readonly chatConfigService: ChatConfigService
  ) {}

  private constructSystemPrompt({
    chatConfig,
    userProfile,
    user,
  }: {
    chatConfig?: ChatConfig | null;
    userProfile?: UserProfile | null;
    user?: RequestUser;
  }) {
    let systemPrompt = chatConfig?.chatAgentPrompt || fallbackPrompts.getChatAgentPrompt();

    systemPrompt += `\n\nCurrent date and time in UTC: ${new Date().toISOString()}`;

    if (userProfile) {
      const { dateOfBirth, gender, placeOfBirth, timeOfBirth } = userProfile;

      const userInfoParts: string[] = [];

      if (user?.name) userInfoParts.push(`Name: ${user.name}`);
      if (gender) userInfoParts.push(`Gender: ${gender}`);
      if (dateOfBirth) userInfoParts.push(`Date of Birth: ${dateOfBirth}`);
      if (timeOfBirth) userInfoParts.push(`Time of Birth: ${timeOfBirth}`);
      if (placeOfBirth) userInfoParts.push(`Place of Birth: ${placeOfBirth}`);

      if (userInfoParts.length > 0) {
        systemPrompt += `\n\nUser Profile Information:\n${userInfoParts.join('\n')}`;
      }
    }

    return systemPrompt;
  }

  async createChat(userId: string) {
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        userId,
      },
      include: {
        chatMessages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (existingChat && existingChat.chatMessages.length === 0) {
      return existingChat;
    }
    return await this.prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          userId,
        },
      });
      await tx.userChatStat.upsert({
        where: { userId },
        update: {
          totalChats: { increment: 1 },
        },
        create: {
          userId,
          totalChats: 1,
        },
      });
      return chat;
    });
  }

  async chat(chatId: string, message: MessageDto, user: RequestUser, res: Response) {
    const [chatConfig, chat, userProfile] = await Promise.all([
      this.chatConfigService.getChatConfig(),
      this.getChat(user.id, chatId),
      this.prisma.userProfile.findUnique({
        where: {
          userId: user.id,
        },
      }),
    ]);
    const newMessage = await this.prisma.chatMessage.create({
      data: {
        chatId,
        content: message.content,
        role: message.role,
        parts: message.parts as unknown as InputJsonValue,
      },
    });

    if (chat.chatMessages.length === 0 && chat.title === 'New Chat') {
      await this.generateAndChangeTitle(message.content, chatId);
    }

    const convertedMessage = dbToModelMessage(newMessage);
    const messages = [...chat.chatMessages, convertedMessage];

    const model = chatConfig?.model && chatConfig.model === 'openai' ? openai('gpt-4.1') : google('gemini-2.0-flash');

    const systemPrompt = this.constructSystemPrompt({ chatConfig, userProfile, user });

    pipeUIMessageStreamToResponse({
      response: res,
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          const result = streamText({
            model: model,
            system: systemPrompt,
            messages: messages,
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

              await this.prisma.chatMessage.create({
                data: {
                  chatId,
                  content: text,
                  role: 'assistant',
                  parts: [{ type: 'text', text: text }],
                },
              });
              await this.prisma.userChatStat.upsert({
                where: { userId: user.id },
                update: {
                  totalTokensUsed: { increment: usage.totalTokens },
                  totalQuestions: { increment: 1 },
                },
                create: {
                  userId: user.id,
                  totalTokensUsed: usage.totalTokens,
                  totalQuestions: 1,
                },
              });
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

  async getChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: {
        id: chatId,
        userId,
      },
      include: {
        chatMessages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return {
      ...chat,
      chatMessages: chat.chatMessages.map(dbToUIMessage),
    };
  }

  async getChats(userId: string, query: GetChatsQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.chat.count({
        where: {
          userId,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      chats,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async updateChat(userId: string, chatId: string, body: UpdateChatDto) {
    const chat = await this.prisma.chat.update({
      where: { id: chatId, userId },
      data: body,
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return { message: 'Chat updated successfully' };
  }

  async deleteChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.delete({
      where: { id: chatId, userId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return { message: 'Chat deleted successfully' };
  }

  private async generateAndChangeTitle(userMessage: string, chatId: string) {
    const res = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        title: z.string(),
      }),
      prompt: `Generate a concise title (max 5 words) that summarizes the intent or topic of the following user message. Avoid punctuation unless necessary. 
			User message:
			${userMessage}`,
    });
    if (res.object.title) {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { title: res.object.title },
      });
    }
  }
}
