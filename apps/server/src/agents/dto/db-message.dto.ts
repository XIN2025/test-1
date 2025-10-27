import { ChatMessage } from '@repo/db';
import {
  AssistantModelMessage,
  FilePart,
  ModelMessage,
  SystemModelMessage,
  TextPart,
  ToolModelMessage,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
  UserModelMessage,
} from 'ai';

export const dbToUIMessage = (message: ChatMessage): UIMessage & { content: string } => {
  const partsFromDb = Array.isArray(message.parts) ? message.parts : [];
  const parts = partsFromDb.length > 0 ? partsFromDb : message.content ? [{ type: 'text', text: message.content }] : [];
  return {
    id: message.id,
    role: message.role as 'system' | 'user' | 'assistant',
    parts: parts as UIMessagePart<UIDataTypes, UITools>[],
    // keep content for backward compatibility
    content: message.content,
  };
};

export const dbToModelMessage = (message: ChatMessage): ModelMessage => {
  const baseMessage = {
    role: message.role as ModelMessage['role'],
  };

  if (message.role === 'user') {
    if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
      const contentParts: Array<TextPart | FilePart> = [{ type: 'text', text: message.content }];

      message.attachments.forEach((attachment: any) => {
        if (attachment.url) {
          contentParts.push({
            type: 'file',
            data: attachment.url,
            mediaType: attachment.contentType || 'application/octet-stream',
            filename: attachment.name,
          });
        }
      });

      return {
        ...baseMessage,
        role: 'user' as const,
        content: contentParts,
      } satisfies UserModelMessage;
    }

    return {
      ...baseMessage,
      role: 'user' as const,
      content: message.content,
    } satisfies UserModelMessage;
  }

  if (message.role === 'assistant') {
    return {
      ...baseMessage,
      role: 'assistant' as const,
      content: message.content,
    } satisfies AssistantModelMessage;
  }

  if (message.role === 'system') {
    return {
      ...baseMessage,
      role: 'system' as const,
      content: message.content,
    } satisfies SystemModelMessage;
  }

  if (message.role === 'tool') {
    return {
      ...baseMessage,
      role: 'tool' as const,
      content: [],
    } satisfies ToolModelMessage;
  }

  return {
    role: message.role as any,
    content: message.content,
  } satisfies ModelMessage;
};
