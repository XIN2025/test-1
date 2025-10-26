import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { ChatStatus, UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
}

function PureChatMessage({ message, status }: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} status={status} />;
  }
}

export const ChatMessage = PureChatMessage;
