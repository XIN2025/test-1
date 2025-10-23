import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UpdateChatConfigDto } from 'src/admin/agents/dto/chat-update.dto';
import { ChatConfig } from '@repo/db';
import { fallbackPrompts } from './prompts';

@Injectable()
export class ChatConfigService {
  private chatConfig: ChatConfig;
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const config = await this.loadChatConfigFromDb();
    this.chatConfig = config || {
      id: '',
      model: 'openai',
      chatAgentPrompt: fallbackPrompts.getChatAgentPrompt(),
      webSearchPrompt: fallbackPrompts.getWebSearchPrompt(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  getChatConfig() {
    return this.chatConfig;
  }

  setChatConfig(chatConfig: ChatConfig) {
    this.chatConfig = chatConfig;
  }

  async loadChatConfigFromDb() {
    console.log('Loading chat config from database');
    const chatConfig = await this.prisma.chatConfig.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1,
    });
    return chatConfig;
  }

  async updateChatConfig(body: UpdateChatConfigDto) {
    const { chatAgentPrompt, webSearchPrompt, model } = body;
    const config = await this.prisma.chatConfig.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1,
    });
    if (config) {
      await this.prisma.chatConfig.update({
        where: { id: config.id },
        data: {
          chatAgentPrompt: chatAgentPrompt,
          webSearchPrompt: webSearchPrompt,
          model: model,
        },
      });
    } else {
      await this.prisma.chatConfig.create({
        data: {
          chatAgentPrompt: chatAgentPrompt || this.chatConfig.chatAgentPrompt,
          webSearchPrompt: webSearchPrompt || this.chatConfig.webSearchPrompt,
          model: model || this.chatConfig.model,
        },
      });
    }
    if (chatAgentPrompt) {
      this.chatConfig.chatAgentPrompt = chatAgentPrompt;
    }
    if (webSearchPrompt) {
      this.chatConfig.webSearchPrompt = webSearchPrompt;
    }
    if (model) {
      this.chatConfig.model = model;
    }
    return true;
  }
}
