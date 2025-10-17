import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { Message } from '@ai-sdk/react';
import { Attachment } from 'ai';
import { memo } from 'react';
import equal from 'fast-deep-equal';

interface ChatMessageProps {
  message: Message & { attachments: Attachment[] };
}

function PureChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} />;
  }
}

export const ChatMessage = memo(PureChatMessage, (prevProps, nextProps) => {
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

  return true;
});
