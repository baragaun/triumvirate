import type { Chat, ChatConfig, User } from '$lib/server/db/schema'
import type { LlmContextVariable } from '$lib/types'
import { findChat } from '$lib/server/chat/findChat'
import { findUser } from '$lib/server/user/findUser'

export async function getVariables(
  chatId: string,
  variables: LlmContextVariable[],
  user?: User | null,
  chat?: Chat | null,
  _chatConfig?: ChatConfig | null,
): Promise<LlmContextVariable[]> {
  if (!chat) {
    chat = await findChat(chatId);

    if (!chat) {
      console.error('llmContextFactory.getVariables: Chat not found', { chatId });
      return [];
    }
  }

  if (!user && chat.userId) {
    user = await findUser(chat.userId);

    if (!user) {
      console.error('llmContextFactory.getVariables: User not found', { userId: chat.userId });
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

  if (user) {
    vars.push({
      name: 'user',
      type: 'string',
      value: user,
    });
  }

  if (chat.userName) {
    vars.push({
      name: 'username',
      type: 'string',
      value: chat.userName,
    });
  }

  return vars;
}
