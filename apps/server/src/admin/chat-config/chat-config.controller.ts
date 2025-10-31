import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateChatConfigDto } from './dto/chat-update.dto';
import { ChatConfigService } from 'src/admin/chat-config/chat-config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiTags('Admin - Chat Config')
@Controller('admin/chat-config')
export class ChatConfigController {
  constructor(private readonly chatConfigService: ChatConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get the chat config' })
  async getChatConfig() {
    return this.chatConfigService.getChatConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update the chat config' })
  updateChatConfig(@Body() body: UpdateChatConfigDto) {
    return this.chatConfigService.updateChatConfig(body);
  }
}
