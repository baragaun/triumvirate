import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteChatConfig(id: string): Promise<void> {
  const db = dataStore.db.get();

  await db
    .update(table.chat)
    .set({ configId: null })
    .where(eq(table.chat.configId, id));

  await db
    .delete(table.chatConfig)
    .where(eq(table.chatConfig.id, id));
}
