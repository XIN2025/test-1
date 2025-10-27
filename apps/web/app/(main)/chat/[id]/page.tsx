import ChatPage from '@/components/chat/ChatPage';
import { ChatService } from '@/services';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const chat = await ChatService.getChatById(id);
    if (!chat) {
      return {
        title: 'Chat not found',
        description: 'This chat does not exist or has been deleted.',
      };
    }
    return {
      title: chat.title ? `${chat.title} | Chat` : 'Chat',
      description: `Conversation in chatbot: ${chat.title ?? id}`,
    };
  } catch (error) {
    return {
      title: 'Chat not found',
      description: 'This chat does not exist or has been deleted.',
    };
  }
}

const ChatItemPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const chat = await ChatService.getChatById(id);
    if (!chat) {
      return notFound();
    }
    return <ChatPage chat={chat} />;
  } catch (error) {
    return notFound();
  }
};

export default ChatItemPage;
