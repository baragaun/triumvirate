import type { Chat, ChatConfig } from '$lib/server/db/schema'
import { compileLlmInstructions } from '$lib/server/chatConfig/compileLlmInstructions'
import { findChat } from '$lib/server/chat/findChat'
import { parseXmlLlmInstructions } from '$lib/server/chatConfig/parseXmlLlmInstructions'
import type { LlmContextVariable } from '$lib/types'
import { getLlmInstructionsForChat } from '$lib/server/chat/getLlmInstructionsForChat'

export async function getCompiledLlmInstructionsForChat(
  chatId: string,
  chat?: Chat | null,
  chatConfig?: ChatConfig | null,
): Promise<string | null> {
  if (!chat) {
    chat = await findChat(chatId);
  }

  if (!chat) {
    console.error('getCompiledLlmInstructionsForChat: Error getting LLM context: Chat not found', { chatId });
    return null;
  }

  const llmInstructions = await getLlmInstructionsForChat(chatId, chat, chatConfig);
  if (!llmInstructions) {
    console.error('getCompiledLlmInstructionsForChat: Error getting LLM context: LLM instructions not found', { chatId });
    return null;
  }

  const vars: LlmContextVariable[] = []
  if (chat.username) {
    vars.push({
      name: 'username',
      type: 'string',
      value: chat.username,
    });
  }

  if (!llmInstructions.startsWith('<context>')) {
    return llmInstructions;
  }

  const context = parseXmlLlmInstructions(llmInstructions)

  return compileLlmInstructions(context, chat.stage, vars);
}
