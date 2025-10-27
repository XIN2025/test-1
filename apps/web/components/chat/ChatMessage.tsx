import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { UIMessage, ChatStatus } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
  isLast: boolean;
}

function PureChatMessage({ message, status, isLast }: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} status={status} isLast={isLast} />;
  }
}

export const ChatMessage = PureChatMessage;
