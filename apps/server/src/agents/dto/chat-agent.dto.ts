import {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';
import { Attachment, JSONValue, Message } from 'ai';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class MessageDto implements Message {
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
  @IsIn(['data', 'system', 'user', 'assistant'])
  role: Message['role'];

  @IsOptional()
  annotations?: JSONValue[] | undefined;

  @IsOptional()
  experimental_attachments?: Attachment[] | undefined;

  @IsOptional()
  parts?:
    | (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[]
    | undefined;
}

export class ChatAgentInputDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
}
