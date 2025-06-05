import type { Chat, ChatConfig } from '$lib/server/db/schema'
import type { LlmContext, LlmContextVariable } from '$lib/types'
import { findChat } from '$lib/server/chat/findChat'

export async function getVariables(
  chatId: string,
  variables: LlmContextVariable[],
  chat?: Chat | null,
  _chatConfig?: ChatConfig | null,
): Promise<LlmContextVariable[]> {
  if (!chat) {
    chat = await findChat(chatId);

    if (!chat) {
      console.error('llmContextFactory.getVariables: Error getting LLM context: Chat not found', { chatId });
      return [];
    }
  }

  const vars: LlmContextVariable[] = variables || [];

  if (!vars.some(v => v.name === 'stage') && chat.stage) {
    vars.push({
      name: 'stage',
      type: 'string',
      value: chat.stage,
    });
  }

  if (chat.username) {
    vars.push({
      name: 'username',
      type: 'string',
      value: chat.username,
    });
  }

  return vars;
}
