import type { Chat, ChatConfig } from '$lib/server/db/schema'
import { parseXmlLlmInstructions } from '$lib/server/chatConfig/parseXmlLlmInstructions'
import type { LlmContext } from '$lib/types'
import { getLlmInstructionsForChat } from '$lib/server/chat/getLlmInstructionsForChat'

export async function getLlmContextObjectForChat(
  chatId: string,
  chat?: Chat | null,
  chatConfig?: ChatConfig | null,
): Promise<LlmContext | null> {
  const llmInstructions = await getLlmInstructionsForChat(chatId, chat, chatConfig);
  if (!llmInstructions) {
    console.error('getLlmContextObjectForChat: Error getting LLM context: LLM instructions not found', { chatId });
    return null;
  }

  if (!llmInstructions.startsWith('<context>')) {
    return null;
  }

  return parseXmlLlmInstructions(llmInstructions)
}
