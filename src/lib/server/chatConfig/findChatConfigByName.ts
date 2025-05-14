import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type ChatConfig } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findChatConfigByName(name: string = 'default'): Promise<ChatConfig> {
  const db = dataStore.db.get();

  return db
    .select()
    .from(table.chatConfig)
    .where(eq(table.chatConfig.name, name || 'default'))
    .limit(1)
    .then(rows => rows[0] || null);
}
