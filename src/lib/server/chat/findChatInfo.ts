import { eq } from 'drizzle-orm'
import * as table from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore'
import type { ChatInfo } from '$lib/types'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'

export async function findChatInfo(id: string): Promise<ChatInfo> {
  const db = dataStore.db.get();

  const rows = await db
    .select()
    .from(table.chat)
    .where(eq(table.chat.id, id))
    .limit(1);

  const chat = rows[0];

  if (!chat) {
    return { error: 'not-found' };
  }

  const chatConfig = await findChatConfig(chat.configId || 'default');
  const chatMessages = await findChatMessages(id);

  return {
    chat,
    chatConfig,
    chatMessages,
  };
}
