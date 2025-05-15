import type { Chat, ChatMessage } from '$lib/server/db/schema'

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

export interface LocalsData {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
  }
}

export interface ChatMetadata {
  from_ai: {
    chat_stage?: string;
    is_bad_actor?: number;
    notes_from_ai?: string;
    data?: Record<string, any>;
  }
}

export interface ClientInfo {
  httpHeaders?: Record<string, string>;
}

export interface ChatCreationRequestData {
  props: Partial<Chat>;
  user: Partial<User>;
}

export interface LlmContextVariable {
  name: string;
  type: string;
  value: string | number | boolean;
}

export interface LlmContextInfo {
  version: string;
  date: string;
  description: string;
}

export interface LlmContextChatStage {
  key: string;
  description: string;
  blocks: string[];
  enabled: boolean;
}

export interface LlmContextBlock {
  key: string;
  content: string;
}

export interface LlmContext {
  info: LlmContextInfo;
  stages: LlmContextChatStage[];
  variables: LlmContextVariable[];
  blocks: LlmContextBlock[];
}
