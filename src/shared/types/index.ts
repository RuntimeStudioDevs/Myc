export * from '../../modules/quote/types/quote.types';
export * from '../../modules/mailer/types/mailer.types';

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  detectedFields?: string[];
}
