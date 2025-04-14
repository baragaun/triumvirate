import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { ChatMessage } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'
import { MessageRole } from '$lib/enums'

export const findChatMessages = async (
  chatId?: string,
  recipientRole?: MessageRole,
): Promise<ChatMessage[]> => {
  const db = dataStore.db.get();

  let messages: ChatMessage[] = [];

  if (chatId) {
    messages = await db
      .select()
      .from(table.chatMessage)
      .where(eq(table.chatMessage.chatId, chatId))
      .orderBy(table.chatMessage.createdAt);
  } else {
    messages = await db
      .select()
      .from(table.chatMessage)
      .orderBy(table.chatMessage.createdAt);
  }

  if (recipientRole === MessageRole.user) {
    return messages.filter(m => m.sendToUser);
  }

  if (recipientRole === MessageRole.assistant) {
    return messages.filter(m => m.sendToLlm);
  }

  return messages;
}
