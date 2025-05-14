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

export interface AdviceData {
  value: string;
  confidence: number;
  specificity: number;
  approved?: boolean;
}

export interface ChatMetadata {
  from_ai: {
    chat_quality?: number;
    user_willingness?: number;
    is_bad_actor?: number;
    goal_reached?: number;
    messages_to_goal?: number;
    notes_from_ai?: string;
    concerns?: string[];
    advice?: AdviceData[];
    data?: Record<string, any>;
  }
  from_platform?: {
    info?: string[];
    instructions?: string[];
  }
}

export interface ClientInfo {
  httpHeaders?: Record<string, string>;
}

export interface ChatCreationRequestData {
  props: Partial<Chat>;
  user: Partial<User>;
}
