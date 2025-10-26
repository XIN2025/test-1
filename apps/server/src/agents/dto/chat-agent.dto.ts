import {
  TextUIPart,
  ReasoningUIPart,
  DynamicToolUIPart,
  SourceUrlUIPart,
  FileUIPart,
  StepStartUIPart,
  SourceDocumentUIPart,
  ToolUIPart,
} from 'ai';
import { UIMessage } from 'ai';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class MessageDto implements UIMessage {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: Date | undefined;

  @IsNotEmpty()
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @IsOptional()
  parts: (
    | TextUIPart
    | ReasoningUIPart
    | DynamicToolUIPart
    | ToolUIPart
    | SourceUrlUIPart
    | SourceDocumentUIPart
    | FileUIPart
    | StepStartUIPart
  )[];
}

export class ChatAgentInputDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
}
