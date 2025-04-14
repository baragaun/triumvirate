import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteChatMessage(id: string): Promise<void> {
  const db = dataStore.db.get();

  await db
    .delete(table.chatMessage)
    .where(eq(table.chatMessage.id, id));
}
