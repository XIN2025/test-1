'use client';
import { UIMessage, useChat } from '@ai-sdk/react';
import React, { useEffect, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';
import { useCreateChat } from '@/queries/chat';
import { DefaultChatTransport } from 'ai';

const ChatPage = () => {
  const { data: session } = useSession();
  const [input, setInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat();

  const [chatId, setChatId] = useState<string | undefined>(undefined);

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: `${envConfig.apiUrl}/api/agents/chat/${chatId}`,
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }),
    messages: [],
    experimental_throttle: 200,
    onFinish: ({ message }) => {
      // setChatMessages((prev) => [...prev, message]);
    },
    onError: (error) => {
      console.error('Error in chat:', error);
    },
  });

  const handleCreateChat = () => {
    createChat(undefined, {
      onSuccess: (data) => {
        setChatId(data.id);
      },
    });
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (input.trim() && !isCreatingChat) {
      sendMessage(
        {
          text: input,
        },
        {
          body: {
            message: {
              content: input,
              role: 'user',
              id: Math.random().toString(36).substring(2, 15),
              createdAt: new Date(),
            },
          },
        }
      );
      setInput('');
    }
  };

  useEffect(() => {
    if (chatId) {
      handleSubmit();
    }
  }, [chatId]);

  if (messages.length === 0) {
    return <Greeting query={input} setQuery={setInput} isSubmitting={isCreatingChat} handleSubmit={handleCreateChat} />;
  }
  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex-1 overflow-auto'>
        <ChatMessages messages={messages} status={status} error={error} />
      </div>
      <div className='flex-shrink-0 p-4 pt-0'>
        <ChatInput
          handleSubmit={handleSubmit}
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
