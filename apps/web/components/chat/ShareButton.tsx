'use client';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Share2, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateChat } from '@/queries/chat';
import { Input } from '@repo/ui/components/input';

interface ShareButtonProps {
  chatId: string;
  isPublic: boolean;
  isOwner: boolean;
}

export function ShareButton({ chatId, isPublic, isOwner }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mutate: updateChat, isPending } = useUpdateChat();

  if (!isOwner) {
    return null;
  }

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${chatId}`;

  const handleOpenDialog = () => {
    setIsOpen(true);
    // Automatically make chat public when opening share dialog
    if (!isPublic) {
      updateChat({ chatId, body: { isPublic: true } });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button onClick={handleOpenDialog} variant='outline' size='sm' disabled={isPending}>
        <Share2 className='h-4 w-4' />
        Share
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='sm:max-w-md'>
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
