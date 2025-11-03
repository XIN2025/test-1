'use client';
import { UIMessage, useChat } from '@ai-sdk/react';
import React, { useEffect, useRef, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';
import { DefaultChatTransport } from 'ai';
import { useChatTransition } from '@/hooks/useChatTransition';
import { useSWRConfig } from 'swr';
import { getChatHistoryPaginationKey } from './ChatHistory';
import { unstable_serialize } from 'swr/infinite';
import { ShareButton } from './ShareButton';

type ChatPageProps = {
  id: string;
  initialMessages: UIMessage[];
  isPublic?: boolean;
  ownerId?: string;
};

const ChatPage = ({ id, initialMessages, isPublic = false, ownerId }: ChatPageProps) => {
  const { query, chatId, clearTransition } = useChatTransition();
  const { data: session } = useSession();
  const initialMessageSentRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [input, setInput] = useState('');

  const isViewingSharedChat = isPublic && ownerId && session?.user.id !== ownerId;
  const isOwner = session?.user.id === ownerId;

  const { messages, sendMessage, status, error, stop } = useChat({
    id,
    transport: new DefaultChatTransport({
      api: `${envConfig.apiUrl}/api/agents/chat/${id}`,
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      prepareSendMessagesRequest(request) {
        return {
          body: {
            message: request.messages.at(-1),
            ...request.body,
          },
        };
      },
    }),
    messages: initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error('Error in chat:', error);
    },
  });

  const handleSubmit = async () => {
    if (input.trim()) {
      setInput('');
      await sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input || query }],
      });
    }
  };

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (id === chatId && query && !initialMessageSentRef.current) {
        initialMessageSentRef.current = true;
        sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: input || query }],
        });

        clearTransition();
      }
    };

    sendInitialMessage();
  }, [id, chatId, query, clearTransition, sendMessage, input]);

  if (messages.length === 0 && !isViewingSharedChat) {
    return (
      <Greeting query={input} setQuery={setInput} isSubmitting={status === 'streaming'} handleSubmit={handleSubmit} />
    );
  }
  return (
    <div className='flex h-full w-full flex-col'>
      {messages.length > 0 && (
        <div className='flex-shrink-0 border-b p-3'>
          <div className='flex items-center justify-end'>
            <ShareButton chatId={id} isPublic={isPublic} isOwner={isOwner} />
          </div>
        </div>
      )}
      <div className='flex-1 overflow-auto'>
        <ChatMessages messages={messages} status={status} error={error} />
      </div>
      {!isViewingSharedChat && (
        <div className='flex-shrink-0 p-4 pt-0'>
          <ChatInput
            onSubmit={handleSubmit}
            query={input}
            setQuery={setInput}
            isSubmitting={status === 'streaming'}
            onStop={stop}
          />
        </div>
      )}
    </div>
  );
};

export default ChatPage;
