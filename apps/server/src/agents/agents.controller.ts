import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatAgentInputDto } from './dto/chat-agent.dto';
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
}
