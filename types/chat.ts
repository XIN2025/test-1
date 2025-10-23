export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  suggestions?: string[];
  isLoading?: boolean;
}
