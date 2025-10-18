import { Injectable, NotFoundException } from '@nestjs/common';
import {
  appendClientMessage,
  appendResponseMessages,
  Message,
  pipeDataStreamToResponse,
  smoothStream,
  streamText,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { prompts } from 'src/agents/prompts';
import { ToolsService } from './tools.service';
import { Response } from 'express';
import * as configJson from './config.json';
import { google } from '@ai-sdk/google';
import { UpdateChatAgentConfigDto } from './dto/chat-agent.dto';
import { writeFileSync } from 'fs';

const chatStore = new Map<string, Message[]>();
const chatConfig: { model: string } = { ...configJson };

@Injectable()
export class AgentsService {
  constructor(private readonly toolsService: ToolsService) {}

  async createChat(userId: string) {
    console.log('createChat', userId);
    const chatId = Math.random().toString(36).substring(2, 15);
    chatStore.set(chatId, []);
    return chatId;
  }

  async chat(chatId: string, message: Message, res: Response): Promise<void> {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    const history = chatStore.get(chatId) || [];
    history.push(message);

    const messages = appendClientMessage({
      messages: history,
      message,
    });

    const model =
      chatConfig.model === 'openai'
        ? openai('gpt-4.1')
        : google('gemini-2.0-flash', {
            useSearchGrounding: true,
          });

    pipeDataStreamToResponse(res, {
      execute: (dataStream) => {
        const result = streamText({
          model: model,
          system: prompts.getChatAgentPrompt(),
          messages: messages,
          maxSteps: 10,
          tools: this.toolsService.getTools(),
          toolCallStreaming: true,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onFinish: async ({ response }) => {
            const [, assistantMessage] = appendResponseMessages({
              messages: [message],
              responseMessages: response.messages,
            });
            history.push(assistantMessage);
            chatStore.set(chatId, history);
          },
          temperature: 0.6,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        console.log('error', error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  }

  getChatMessages(chatId: string) {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    return chatStore.get(chatId) || [];
  }

  deleteChat(chatId: string) {
    if (!chatStore.has(chatId)) {
      throw new NotFoundException('Chat not found');
    }
    chatStore.delete(chatId);
    return true;
  }

  getChatConfig() {
    const prompt = prompts.getChatAgentPrompt();
    return {
      prompt: prompt,
      model: chatConfig.model,
    };
  }

  updateChatConfig(body: UpdateChatAgentConfigDto) {
    const { prompt, model } = body;
    if (prompt) {
      prompts.updateChatAgentPrompt(prompt);
    }
    if (model) {
      chatConfig.model = model;
    }
    writeFileSync('src/agents/config.json', JSON.stringify(chatConfig, null, 2));
    return true;
  }
}
