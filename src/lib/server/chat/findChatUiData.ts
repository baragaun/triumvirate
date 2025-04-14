import { MessageRole } from '$lib/enums'
import type { ChatUiData } from '$lib/types';
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'
import { findChatConfigs } from '$lib/server/chatConfig/findChatConfigs'
import { findLlms } from '$lib/server/llm/findLlms'
import { findChat } from '$lib/server/chat/findChat'
import { findUser } from '$lib/server/user/findUser'

export async function findChatUiData(chatId: string): Promise<ChatUiData> {
  const chat = await findChat(chatId);

  if (!chat) {
    return { error: 'not-found' };
  }

  const user = await findUser(chat.userId as string);
  const chatMessages = await findChatMessages(chatId, MessageRole.user);
  const chatConfigs = await findChatConfigs();
  const llms = await findLlms(true);

  return {
    user,
    chat,
    chatMessages,
    chatConfigs,
    llms,
  };
}
