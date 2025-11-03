'use client';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Share2, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useUpdateChat } from '@/queries/chat';
import { Input } from '@repo/ui/components/input';
import { CustomAlertDialog } from '../general/CustomAlertDialog';

interface ShareButtonProps {
  chatId: string;
  isPublic: boolean;
  isOwner: boolean;
}

export function ShareButton({ chatId, isPublic, isOwner }: ShareButtonProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mutate: updateChat, isPending } = useUpdateChat();

  if (!isOwner) {
    return null;
  }

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${chatId}`;

  const handleShare = () => {
    if (!isPublic) {
      updateChat(
        { chatId, body: { isPublic: true } },
        {
          onSuccess: () => {
            setIsAlertOpen(false);
            setIsShareDialogOpen(true);
          },
        }
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDialog = () => {
    if (isPublic) {
      setIsShareDialogOpen(true);
    } else {
      setIsAlertOpen(true);
    }
  };

  return (
    <>
      <Button onClick={handleDialog} variant='outline' size='sm' disabled={isPending}>
        <Share2 className='h-4 w-4' />
        Share
      </Button>

      <CustomAlertDialog
        isOpen={isAlertOpen}
        cancelText='No, Cancel'
        confirmText='Yes, Share'
        onClose={() => setIsAlertOpen(false)}
        onConfirm={handleShare}
        isLoading={isPending}
        title='Share this chat'
        confirmButtonClassName='bg-primary hover:bg-primary/90 text-white'
        description='Are you sure you want to share this chat? This will make the chat public and anyone can view it.'
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>Share this link with anyone to let them view this conversation</DialogDescription>
          </DialogHeader>

          <div className='flex gap-2 py-4'>
            <Input value={shareUrl} readOnly className='flex-1' />
            <Button onClick={copyToClipboard} size='icon' variant='outline'>
              {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
