'use client';
import { Message, useChat } from '@ai-sdk/react';
import React, { useEffect, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';
import { useCreateChat } from '@/queries/chat';

const ChatPage = () => {
  const { data: session } = useSession();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat();

  const [chatId, setChatId] = useState<string | undefined>(undefined);

  const { messages, handleSubmit, input, setInput, status, error, stop } = useChat({
    id: chatId,
    api: `${envConfig.apiUrl}/api/agents/chat/${chatId}`,
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
    },
    initialMessages: chatMessages,
    experimental_throttle: 200,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody: (body) => ({
      message: body.messages.at(-1),
    }),
    onFinish: (message) => {
      setChatMessages([...chatMessages, message]);
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

  useEffect(() => {
    if (chatId) {
      handleSubmit();
    }
  }, [chatId]);

  if (messages.length === 0) {
    return <Greeting query={input} setQuery={setInput} isSubmitting={isCreatingChat} handleSubmit={handleCreateChat} />;
  }
  return (
    <div className='flex h-[calc(100vh-3rem)] w-full flex-col pb-4'>
      <ChatMessages messages={messages} status={status} error={error} isLoading={status === 'streaming'} />
      <ChatInput
        handleSubmit={handleSubmit}
        query={input}
        setQuery={setInput}
        isSubmitting={status === 'streaming'}
        onStop={stop}
      />
    </div>
  );
};

export default ChatPage;
