import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type ChatConfig } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findChatConfig(id: string): Promise<ChatConfig> {
  const db = dataStore.db.get();

  return db
    .select()
    .from(table.chatConfig)
    .where(eq(table.chatConfig.id, id))
    .limit(1)
    .then(rows => rows[0] || null);
}
