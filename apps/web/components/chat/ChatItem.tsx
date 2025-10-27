import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@repo/ui/components/sidebar';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { memo } from 'react';
import { ChatType } from '@repo/shared-types/types';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: ChatType;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <SidebarMenuAction
        className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5'
        showOnHover
        onClick={() => onDelete(chat.id)}
      >
        <Trash2 className='text-destructive size-4' />
        <span className='sr-only'>Delete</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem);
