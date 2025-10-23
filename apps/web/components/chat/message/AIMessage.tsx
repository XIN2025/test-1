import { cn } from '@repo/ui/lib/utils';
import { Message } from '@ai-sdk/react';
import React, { useState } from 'react';
import CustomMarkdown from '../CustomMarkdown';
import { format } from 'date-fns';
import { toolComponents } from '../tools';
import { Attachment } from 'ai';
import { Check } from 'lucide-react';
import { Copy } from 'lucide-react';

type AIMessageProps = {
  message: Message & { attachments: Attachment[] };
};

const AIMessage = ({ message }: AIMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n');
      if (content) {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  return (
    <div className='flex max-w-full justify-start gap-3'>
      <div className={cn('flex flex-1 flex-col gap-1', 'items-start')}>
        <div className={'w-full text-sm'}>
          {message.parts?.map((part, index) => {
            const { type } = part;
            if (type === 'reasoning') {
              return <CustomMarkdown key={index} className='text-sm italic' message={part.reasoning} />;
            }
            if (type === 'text') {
              return <CustomMarkdown key={index} message={part.text} />;
            }
            if (type === 'tool-invocation') {
              const { toolName } = part.toolInvocation;
              if (toolName in toolComponents) {
                const ToolComponent = toolComponents[toolName as keyof typeof toolComponents];
                return <ToolComponent key={index} tool={part.toolInvocation} />;
              }
              return null;
            }
          })}
        </div>
        <div className='flex items-center gap-1.5'>
          <span className={cn('text-xs', 'text-muted-foreground')}>
            {format(new Date(message.createdAt || new Date()), 'h:mm a')}
          </span>
          <button
            onClick={handleCopy}
            className='hover:bg-muted text-muted-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm p-0.5'
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIMessage;
