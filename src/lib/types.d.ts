import type { ChatMessage } from '$lib/server/db/schema'

export interface ChatInfo {
  error?: string;
  chat?: Chat | null;
  chatMessages?: ChatMessage[];
  chatConfig?: ChatConfig | null;
}

export interface ChatUiData {
  error?: string;
  user?: User | null;
  guestUserName?: string | null;
  chat?: Chat | null;
  chatMessages?: ChatMessage[];
  chatConfigs?: ChatConfig[];
  llms?: Llm[];
}

export interface ChangeObjectResponse<T = any> {
  error?: string;
  object?: T | null;
}

export interface ChangeChatMessageResponse {
  error?: string;
  chatMessages?: ChatMessage[];
}

export interface GenerateChatMessageResponse {
  error?: string;
  chatMessage?: ChatMessage;
}

export interface EndChatRequest {
  feedback?: string;
  rating?: number;
}
