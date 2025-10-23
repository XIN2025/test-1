import { Module } from '@nestjs/common';
import { AdminAgentsController } from './agents/admin-agents.controller';
import { AgentsModule } from 'src/agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [AdminAgentsController],
  providers: [],
})
export class AdminModule {}
