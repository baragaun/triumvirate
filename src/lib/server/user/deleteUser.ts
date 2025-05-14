import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteUser(id: string): Promise<void> {
  const db = dataStore.db.get();

  // Get all chats for the user
  const userChats = await db
    .select({ id: table.chat.id })
    .from(table.chat)
    .where(eq(table.chat.userId, id))
    .orderBy(table.chat.createdAt);

  // Delete all chat messages for each chat, then delete the chat
  for (const chat of userChats) {
    // Delete all messages in the chat
    await db
      .delete(table.chatMessage)
      .where(eq(table.chatMessage.chatId, chat.id));
    
    // Delete the chat
    await db
      .delete(table.chat)
      .where(eq(table.chat.id, chat.id));
  }

  // Finally delete the user
  await db
    .delete(table.user)
    .where(eq(table.user.id, id));
}
