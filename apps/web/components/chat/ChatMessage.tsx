import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { UIMessage } from 'ai';
import MessageLoading from './MessageLoading';
import ErrorMessage from './ErrorMessage';

interface ChatMessageProps {
  message: UIMessage;
  lastMessageId?: string;
  isMessageLoading: boolean;
  error?: Error;
}

function PureChatMessage({ message, lastMessageId, isMessageLoading, error }: ChatMessageProps) {
  if (message.id === lastMessageId && isMessageLoading) {
    return <MessageLoading />;
  } else if (message.id === lastMessageId && error) {
    return <ErrorMessage error={error?.message ?? 'An error occurred'} />;
  } else if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} />;
  }
}

export const ChatMessage = PureChatMessage;
