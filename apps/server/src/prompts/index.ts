import { readFileSync, writeFileSync } from 'fs';

export const prompts = {
  getChatAgentPrompt: () => {
    const chatAgentPrompt = readFileSync(`src/prompts/chat-agent.md`, 'utf8');
    return chatAgentPrompt;
  },
  getWebSearchPrompt: () => {
    const webSearchPrompt = readFileSync(`src/prompts/web-search.md`, 'utf8');
    return webSearchPrompt;
  },
  updateChatAgentPrompt: (prompt: string) => {
    writeFileSync(`src/prompts/chat-agent.md`, prompt);
    return true;
  },
};
