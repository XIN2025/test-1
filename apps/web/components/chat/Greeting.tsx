import { Compass, Heart, Sparkles, Stars, Target } from 'lucide-react';
import React from 'react';
import ChatInput from './ChatInput';
import { Card } from '@repo/ui/components/card';

const suggestedPrompts = [
  {
    icon: <Stars className='size-4' />,
    title: 'Understand my birth chart',
    description: 'Explain what my planets and signs reveal about me',
  },
  {
    icon: <Compass className='size-4' />,
    title: 'Life direction guidance',
    description: 'Help me choose the right career or life path',
  },
  {
    icon: <Heart className='size-4' />,
    title: 'Relationship insights',
    description: 'What do the stars say about my love life?',
  },
  {
    icon: <Target className='size-4' />,
    title: 'Timing & opportunities',
    description: 'Is this a good time to start something new?',
  },
];

type GreetingProps = {
  query: string;
  setQuery: (query: string) => void;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
};

const Greeting = ({ query, setQuery, isSubmitting, handleSubmit }: GreetingProps) => {
  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    setTimeout(() => {
      handleSubmit();
    }, 200);
  };
  return (
    <div className='mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col items-center justify-center px-4 py-8'>
      {/* Header Section */}
      <div className='mb-8 space-y-4 text-center'>
        <div className='mb-6 flex items-center justify-center'>
          <div className='from-primary/10 to-primary/5 border-primary/20 rounded-2xl border bg-gradient-to-br p-3'>
            <Sparkles className='text-primary size-8' />
          </div>
        </div>
        <div className='from-foreground to-foreground/70 space-y-2 bg-gradient-to-r bg-clip-text text-center text-transparent'>
          <p className='text-3xl font-bold'>
            Hi, I'm Karmi <span className='text-primary'>👋🏻</span>
          </p>
          <p className='text-5xl font-bold'>How can I help you today?</p>
        </div>
      </div>

      {/* Input Section */}
      <div className='mb-8 w-full max-w-3xl'>
        <ChatInput query={query} setQuery={setQuery} isSubmitting={isSubmitting} handleSubmit={handleSubmit} />
      </div>

      {/* Suggested Prompts */}
      <div className='w-full max-w-4xl'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {suggestedPrompts.map((prompt, index) => (
            <Card
              key={index}
              className='group hover:border-primary/20 bg-background/50 border-input/50 cursor-pointer p-0 backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md'
              onClick={() => handlePromptClick(`${prompt.title} ${prompt.description}`)}
            >
              <div className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary group-hover:bg-primary/15 rounded-lg p-1.5 transition-colors'>
                    {prompt.icon}
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-foreground group-hover:text-primary text-sm font-medium transition-colors'>
                      {prompt.title}
                    </h3>
                    <p className='text-muted-foreground text-xs'>{prompt.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className='mt-12 text-center'>
        <p className='text-muted-foreground text-sm'>AI can make mistakes. Consider checking important information.</p>
      </div>
    </div>
  );
};

export default Greeting;
