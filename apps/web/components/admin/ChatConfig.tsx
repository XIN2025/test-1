'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@repo/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@repo/ui/components/resizable';
import { useGetChatConfig, useUpdateChatConfig } from '@/queries';
import { toast } from 'sonner';
import LoadingButton from '../general/LoadingButton';
import { AlertTriangle } from 'lucide-react';
import { DataLoader } from '../general/DataLoader';
import EmptyMessage from '../general/EmptyMessage';
import CustomMarkdown from '../chat/CustomMarkdown';
import { icons } from '../icons';

type AIModel = 'gemini' | 'openai';

export const ChatConfig: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('openai');

  const { data: configData, isLoading, error } = useGetChatConfig();
  const { mutate: updateConfig, isPending: isSaving } = useUpdateChatConfig();

  useEffect(() => {
    if (configData) {
      setMarkdown(configData.chatAgentPrompt);
      setSelectedModel(configData.model as AIModel);
    }
  }, [configData]);

  const handleSave = async () => {
    if (!markdown.trim()) {
      toast.error('Config cannot be empty');
      return;
    }
    updateConfig({ chatAgentPrompt: markdown, model: selectedModel as 'openai' | 'gemini' });
  };

  const handleReset = () => {
    if (configData) {
      setMarkdown(configData.chatAgentPrompt);
      setSelectedModel(configData.model as AIModel);
      toast.info('Changes are reset');
    }
  };

  if (isLoading) {
    return <DataLoader message='Loading config...' />;
  }

  if (error) {
    return (
      <EmptyMessage
        icon={<AlertTriangle className='text-destructive h-4 w-4' />}
        message='Error loading config'
        description={error.message}
      />
    );
  }

  const hasChanges = markdown !== configData?.chatAgentPrompt || selectedModel !== (configData?.model as AIModel);

  return (
    <div className='flex h-full flex-col gap-4 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Chat Config Editor</h1>
          <p className='text-muted-foreground text-sm'>Edit the chat agent config</p>
        </div>
        <div className='flex items-center gap-3'>
          {hasChanges && <div className='text-sm text-amber-600 dark:text-amber-400'>You have unsaved changes</div>}
          {hasChanges && (
            <Button size='sm' variant='outline' onClick={handleReset} disabled={isSaving}>
              Reset Changes
            </Button>
          )}
          <Select value={selectedModel} onValueChange={(value: AIModel) => setSelectedModel(value)}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select AI Model' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='gemini'>
                <div className='flex items-center gap-2'>
                  {icons.google}
                  <span>Gemini</span>
                </div>
              </SelectItem>
              <SelectItem value='openai'>
                <div className='flex items-center gap-2'>
                  {icons.openai}
                  <span>OpenAI</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <LoadingButton size='sm' isLoading={isSaving} onClick={handleSave} disabled={isSaving || !hasChanges}>
            Save Changes
          </LoadingButton>
        </div>
      </div>

      <ResizablePanelGroup direction='horizontal' className='flex-1 rounded-lg border'>
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className='flex h-full flex-col'>
            <div className='flex items-center justify-between border-b p-4'>
              <h2 className='text-lg font-semibold'>Editor</h2>
            </div>
            <div className='flex-1'>
              <Editor
                height='100%'
                defaultLanguage='markdown'
                value={markdown}
                onChange={(val: string | undefined) => setMarkdown(val || '')}
                theme='vs-light'
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={20}>
          <div className='flex h-full flex-col'>
            <h2 className='border-b p-4 text-lg font-semibold'>Preview</h2>
            <div className='flex-1 overflow-auto p-4'>
              <CustomMarkdown message={markdown} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
