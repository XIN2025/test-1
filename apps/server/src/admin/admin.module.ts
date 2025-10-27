import { Module } from '@nestjs/common';
import { ChatConfigController } from './chat-config/chat-config.controller';
import { AgentsModule } from 'src/agents/agents.module';
import { ChatConfigService } from './chat-config/chat-config.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [AgentsModule],
  controllers: [ChatConfigController, UsersController],
  providers: [ChatConfigService, UsersService],
  exports: [ChatConfigService, UsersService],
})
export class AdminModule {}
