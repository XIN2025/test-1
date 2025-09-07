export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  suggestions?: string[];
  isLoading?: boolean;
}

export interface ChatHookReturn {
  messages: Message[];
  inputText: string;
  isTyping: boolean;
  setInputText: (text: string) => void;
  handleSendMessage: (text: string) => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
  dismissKeyboard: () => void;
}
