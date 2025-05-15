import type { Chat, ChatConfig } from '$lib/server/db/schema'
import { findChat } from '$lib/server/chat/findChat'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'

export async function getLlmInstructionsForChat(
  chatId: string,
  chat?: Chat | null,
  chatConfig?: ChatConfig | null,
): Promise<string | null> {
  if (!chat) {
    chat = await findChat(chatId);
  }

  if (!chat) {
    console.error('getLlmInstructionsForChat: Error getting LLM context: Chat not found', { chatId });
    return null;
  }

  let llmInstructions = chat.llmInstructions;
  if (!llmInstructions) {
    if (!chatConfig) {
      chatConfig = await findChatConfig(chat.configId || 'default');

      if (!chatConfig) {
        console.error('getLlmInstructionsForChat: Error getting LLM context: Chat config not found',
          { chatId, chatConfigId: chat.configId });
        return null;
      }
    }

    llmInstructions = chatConfig.llmInstructions;
  }

  if (!llmInstructions) {
    console.error('getLlmInstructionsForChat: Error getting LLM context: LLM instructions not found', { chatId });
    return null;
  }

  return llmInstructions
}
