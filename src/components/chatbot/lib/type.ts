export interface ChatInterfaceProps {
  className?: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user';
  content: string;
  timestamp: string;
}