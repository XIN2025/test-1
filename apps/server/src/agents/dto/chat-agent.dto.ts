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
import { Transform, Type } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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

export class UpdateChatDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class GetChatsQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(value, 50))
  limit: number = 10;
}
