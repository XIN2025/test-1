'use client';
import { Message, useChat } from '@ai-sdk/react';
import React, { useEffect, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';

const ChatPage = () => {
  const { data: session } = useSession();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 15));
  }, []);

  const { messages, handleSubmit, input, setInput, status, error, stop } = useChat({
    id: sessionId,
    api: `${envConfig.apiUrl}/api/agents/chat`,
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
    },
    initialMessages: chatMessages,
    experimental_throttle: 200,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody: (body) => ({
      sessionId: sessionId,
      query: input,
    }),
    onFinish: (message) => {
      setChatMessages([...chatMessages, message]);
    },
    onError: (error) => {
      console.error('Error in chat:', error);
    },
  });

  if (messages.length === 0) {
    return (
      <Greeting query={input} setQuery={setInput} isSubmitting={status === 'streaming'} handleSubmit={handleSubmit} />
    );
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
