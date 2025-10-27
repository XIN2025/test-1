import { Module } from '@nestjs/common';
import { ChatConfigController } from './chat-config/chat-config.controller';
import { AgentsModule } from 'src/agents/agents.module';
import { ChatConfigService } from './chat-config/chat-config.service';

@Module({
  imports: [AgentsModule],
  controllers: [ChatConfigController],
  providers: [ChatConfigService],
  exports: [ChatConfigService],
})
export class AdminModule {}
