import { Body, Controller, Delete, Get, Param, Post, Put, Res } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Response } from 'express';
import { ApiOperation } from '@nestjs/swagger';
import { ChatAgentInputDto, UpdateChatAgentConfigDto } from './dto/chat-agent.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  createChat(@CurrentUser() user: RequestUser) {
    return this.agentsService.createChat(user?.id);
  }

  @Post('chat/:chatId')
  @ApiOperation({ summary: 'Chat with the Karmi agent' })
  async chat(@Body() body: ChatAgentInputDto, @Param('chatId') chatId: string, @Res() res: Response) {
    return this.agentsService.chat(chatId, body.message, res);
  }

  @Get('chat/:chatId/messages')
  @ApiOperation({ summary: 'Get the messages for a chat' })
  getChatMessages(@Param('chatId') chatId: string) {
    return this.agentsService.getChatMessages(chatId);
  }

  @Delete('chat/:chatId')
  @ApiOperation({ summary: 'Delete a chat' })
  deleteChat(@Param('chatId') chatId: string) {
    return this.agentsService.deleteChat(chatId);
  }

  @Get('config/chat')
  @ApiOperation({ summary: 'Get the chat agent prompt' })
  getChatConfig() {
    return this.agentsService.getChatConfig();
  }

  @Put('config/chat')
  @ApiOperation({ summary: 'Update the chat agent prompt' })
  updateChatConfig(@Body() body: UpdateChatAgentConfigDto) {
    return this.agentsService.updateChatConfig(body);
  }
}
