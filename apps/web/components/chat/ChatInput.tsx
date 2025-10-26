import React, { useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { UIMessage, UseChatHelpers } from '@ai-sdk/react';

interface ChatInputProps {
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  query: string;
  setQuery: (query: string) => void;
  initialPage?: boolean;
  onStop?: UseChatHelpers<UIMessage>['stop'];
}

const ChatInput: React.FC<ChatInputProps> = ({ isSubmitting, handleSubmit, query, setQuery, onStop }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleInput = (): void => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query?.trim() && !isSubmitting) {
        handleSubmit();
      }
    }
  };

  useEffect(() => {
    if (!isSubmitting && textareaRef.current) {
      textareaRef.current.focus();
      handleInput();
    }
  }, [isSubmitting]);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-2'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={cn('relative flex w-full flex-col gap-2 overflow-hidden rounded-xl', isSubmitting && 'opacity-90')}
      >
        <div className='bg-card/80 border-input relative flex flex-col overflow-hidden rounded-xl border'>
          <textarea
            ref={textareaRef}
            disabled={isSubmitting}
            value={query}
            onInput={handleInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='How can I help you today?'
            className={cn(
              'placeholder:text-muted-foreground/60 h-auto max-h-[200px] min-h-[50px] w-full resize-none bg-transparent px-4 py-4 outline-none focus:ring-0',
              isSubmitting && 'cursor-not-allowed'
            )}
          />
          <div className='flex items-center justify-end gap-2 p-2 pt-0'>
            <div className='flex items-center gap-2'>
              {isSubmitting && onStop ? (
                <Button type='button' className='rounded-xl' size='sm' onClick={onStop}>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Stop
                </Button>
              ) : (
                <Button type='submit' className='rounded-xl' size='sm' disabled={isSubmitting || !query?.trim()}>
                  {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : <ArrowRight className='h-4 w-4' />}
                  Generate
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
