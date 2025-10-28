'use client';
import { UIMessage, useChat } from '@ai-sdk/react';
import React, { useEffect, useRef, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';
import { DefaultChatTransport } from 'ai';
import { ChatType } from '@repo/shared-types/types';
import { useChatTransition } from '@/hooks/useChatTransition';
import { unstable_serialize, useSWRConfig } from 'swr';
import { getChatHistoryPaginationKey } from './ChatHistory';

type ChatPageProps = {
  chat: ChatType;
};

const ChatPage = ({ chat }: ChatPageProps) => {
  const { query, chatId, clearTransition } = useChatTransition();
  const { data: session } = useSession();
  const initialMessageSentRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chat.id,
    transport: new DefaultChatTransport({
      api: `${envConfig.apiUrl}/api/agents/chat/${chat.id}`,
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }),
    messages: chat.chatMessages as unknown as UIMessage[],
    experimental_throttle: 50,
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
      await sendMessage(
        {
          text: input || query,
        },
        {
          body: {
            message: {
              content: input || query,
              role: 'user',
              id: Math.random().toString(36).substring(2, 15),
              createdAt: new Date(),
            },
          },
        }
      );
    }
  };

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (chat.id === chatId && query && !initialMessageSentRef.current) {
        initialMessageSentRef.current = true;
        sendMessage(
          {
            text: input || query,
          },
          {
            body: {
              message: {
                id: Math.random().toString(36).substring(2, 15),
                content: input || query,
                role: 'user',
                parts: {},
                attachments: [],
              },
            },
          }
        );

        clearTransition();
      }
    };

    sendInitialMessage();
  }, [chat.id, chatId, query, clearTransition, sendMessage, input]);

  if (messages.length === 0) {
    return (
      <Greeting query={input} setQuery={setInput} isSubmitting={status === 'streaming'} handleSubmit={handleSubmit} />
    );
  }
  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex-1 overflow-auto'>
        <ChatMessages messages={messages} status={status} error={error} />
      </div>
      <div className='flex-shrink-0 p-4 pt-0'>
        <ChatInput
          onSubmit={handleSubmit}
          query={input}
          setQuery={setInput}
          isSubmitting={status === 'streaming'}
          onStop={stop}
        />
      </div>
    </div>
  );
};

export default ChatPage;
