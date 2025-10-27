import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UpdateChatConfigDto } from 'src/admin/chat-config/dto/chat-update.dto';

@Injectable()
export class ChatConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getChatConfig() {
    return this.prisma.chatConfig.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
      take: 1,
    });
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
          chatAgentPrompt: chatAgentPrompt || '',
          webSearchPrompt: webSearchPrompt || '',
          model: model || '',
        },
      });
    }
    return true;
  }
}
