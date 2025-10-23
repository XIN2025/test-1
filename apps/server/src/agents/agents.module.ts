import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { ToolsService } from './tools.service';
import { AstrologyApiModule } from 'src/astrology-apis/astrology-api.module';
import { ChatConfigService } from './chat-config.service';

@Module({
  imports: [AstrologyApiModule],
  controllers: [AgentsController],
  providers: [AgentsService, ToolsService, ChatConfigService],
  exports: [AgentsService, ToolsService, ChatConfigService],
})
export class AgentsModule {}
