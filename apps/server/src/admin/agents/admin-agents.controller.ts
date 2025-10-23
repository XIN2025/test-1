import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateChatConfigDto } from './dto/chat-update.dto';
import { ChatConfigService } from 'src/agents/chat-config.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('admin/agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiTags('Admin')
export class AdminAgentsController {
  constructor(private readonly chatConfigService: ChatConfigService) {}

  @Get('config/chat')
  @ApiOperation({ summary: 'Get the chat config' })
  getChatConfig() {
    return this.chatConfigService.loadChatConfigFromDb();
  }

  @Put('config/chat')
  @ApiOperation({ summary: 'Update the chat config' })
  updateChatConfig(@Body() body: UpdateChatConfigDto) {
    return this.chatConfigService.updateChatConfig(body);
  }
}
