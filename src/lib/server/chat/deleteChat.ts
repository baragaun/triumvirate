import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteChat(id: string): Promise<void> {
  const db = dataStore.db.get();

  // First delete all messages in the chat
  await db
    .delete(table.chatMessage)
    .where(eq(table.chatMessage.chatId, id));

  // Then delete the chat
  await db
    .delete(table.chat)
    .where(eq(table.chat.id, id));
}
