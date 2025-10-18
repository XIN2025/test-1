import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Message } from 'ai';
import { Response } from 'express';
import { ApiOperation } from '@nestjs/swagger';
import { prompts } from 'src/prompts';
import { ChatAgentInputDto, UpdateChatAgentPromptDto } from './dto/chat-agent.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  createChat(@CurrentUser() user: RequestUser) {
    return this.agentsService.createChat(user.id);
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

  @Get('prompts/chat')
  @ApiOperation({ summary: 'Get the chat agent prompt' })
  getChatPrompt() {
    return prompts.getChatAgentPrompt();
  }

  @Put('prompts/chat')
  @ApiOperation({ summary: 'Update the chat agent prompt' })
  updateChatPrompt(@Body() body: UpdateChatAgentPromptDto) {
    return prompts.updateChatAgentPrompt(body.prompt);
  }
}
