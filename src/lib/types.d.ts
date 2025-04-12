import type { ChatMessage } from '$lib/server/db/schema'

export interface CreateChatResponse {
  error?: string;
  chat?: Chat | null;
  llmContext?: LlmContext | null;
  chatMessages?: ChatMessage[];
}

export interface GetChatResponse {
  error?: string;
  chat?: Chat | null;
  chatMessages?: ChatMessage[];
  llmContext?: LlmContext | null;
}

export interface CreateChatMessageResponse {
  error?: string;
  messages?: ChatMessage[];
}

export interface EndChatRequest {
  feedback?: string;
  rating?: number;
}
