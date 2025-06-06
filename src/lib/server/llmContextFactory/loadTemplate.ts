import type { Chat, ChatConfig } from '$lib/server/db/schema'
import { getLlmInstructionsForChat } from '$lib/server/chat/getLlmInstructionsForChat'
import { findChat } from '$lib/server/chat/findChat'

export async function loadTemplate(
  chatId: string,
  chat?: Chat | null,
  chatConfig?: ChatConfig | null,
): Promise<string | null> {
  if (!chat) {
    chat = await findChat(chatId);

    if (!chat) {
      console.error('loadTemplate: Error getting LLM context: Chat not found', { chatId });
      return null;
    }
  }

  return getLlmInstructionsForChat(chatId, chat, chatConfig);
}
