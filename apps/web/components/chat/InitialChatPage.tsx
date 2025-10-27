'use client';
import React from 'react';
import { useChatTransition } from '@/hooks/useChatTransition';
import { useRouter } from 'next/navigation';
import { useCreateChat } from '@/queries/chat';
import Greeting from './Greeting';

const InitialChatPage = () => {
  const { setQuery, query, setChatId } = useChatTransition();
  const router = useRouter();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat();

  const handleSubmit = async () => {
    createChat(undefined, {
      onSuccess: (data) => {
        setChatId(data.id);
        router.push(`/chat/${data.id}`);
        router.refresh();
      },
    });
  };

  return <Greeting query={query} setQuery={setQuery} isSubmitting={isCreatingChat} handleSubmit={handleSubmit} />;
};

export default InitialChatPage;
