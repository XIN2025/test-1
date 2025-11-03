import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatAgentInputDto, GetChatsQueryDto, UpdateChatDto } from './dto/chat-agent.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Agents')
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
  async chat(
    @Body() body: ChatAgentInputDto,
    @Param('chatId') chatId: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response
  ) {
    return this.agentsService.chat(chatId, body.message, user, res);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get chat' })
  getChat(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.agentsService.getChat(user.id, chatId);
  }

  @Get('chat/:chatId/messages')
  @ApiOperation({ summary: 'Get chat with messages' })
  getChatWithMessages(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.agentsService.getChatWithMessages(user.id, chatId);
  }

  @Get('chats')
  @ApiOperation({ summary: 'Get all chats' })
  getChats(@Query() query: GetChatsQueryDto, @CurrentUser() user: RequestUser) {
    return this.agentsService.getChats(user.id, query);
  }

  @Delete('chat/:chatId')
  @ApiOperation({ summary: 'Delete a chat' })
  deleteChat(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.agentsService.deleteChat(user.id, chatId);
  }

  @Put('chat/:chatId')
  @ApiOperation({ summary: 'Update a chat' })
  updateChat(@Param('chatId') chatId: string, @Body() body: UpdateChatDto, @CurrentUser() user: RequestUser) {
    return this.agentsService.updateChat(user.id, chatId, body);
  }
}
