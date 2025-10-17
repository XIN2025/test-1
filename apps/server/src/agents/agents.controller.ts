import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Message } from 'ai';
import { Response } from 'express';

@Controller('agents')
export class AgentsController {
  constructor(private readonly sessionService: AgentsService) {}

  @Post('chat')
  async chat(@Body() body: { sessionId: string; query: string }, @Res() res: Response) {
    const message: Message = {
      id: Math.random().toString(36).substring(2, 15),
      content: body.query,
      role: 'user',
      createdAt: new Date(),
    };
    return this.sessionService.chat(body.sessionId, message, res);
  }
}
