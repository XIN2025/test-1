import { Chat, ChatConfig, ChatMessage } from '@repo/db';

export type ChatConfigType = ChatConfig;
export type ChatType = Chat & {
  chatMessages: ChatMessage[];
};
