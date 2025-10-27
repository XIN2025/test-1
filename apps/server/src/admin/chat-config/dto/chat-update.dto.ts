import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateChatConfigDto {
  @IsString()
  @IsOptional()
  chatAgentPrompt?: string;

  @IsString()
  @IsOptional()
  webSearchPrompt?: string;

  @IsIn(['openai', 'gemini'])
  @IsOptional()
  model?: 'openai' | 'gemini';
}
