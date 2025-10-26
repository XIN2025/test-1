import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { ChatStatus, UIMessage } from 'ai';
import MessageLoading from './MessageLoading';
import ErrorMessage from './ErrorMessage';

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
  lastMessageId?: string;
  isMessageLoading: boolean;
  error?: Error;
}

function PureChatMessage({ message, status, lastMessageId, isMessageLoading, error }: ChatMessageProps) {
  if (message.id === lastMessageId && isMessageLoading) {
    return <MessageLoading />;
  } else if (message.id === lastMessageId && status === 'error') {
    return <ErrorMessage error={error?.message ?? 'An error occurred'} />;
  } else if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} status={status} />;
  }
}

export const ChatMessage = PureChatMessage;
