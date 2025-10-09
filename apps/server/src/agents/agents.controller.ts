import { Controller, Get, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly sessionService: AgentsService) {}

  @Get('chat')
  async chat(@Query('sessionId') sessionId: string, @Query('query') query: string) {
    return this.sessionService.chat(sessionId, query);
  }
}
