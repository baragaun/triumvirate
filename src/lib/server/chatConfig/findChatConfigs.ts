import * as table from '$lib/server/db/schema';
import { type ChatConfig } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findChatConfigs(): Promise<ChatConfig[]> {
  const db = dataStore.db.get();

  const chatConfigs = await db
    .select()
    .from(table.chatConfig)
    .orderBy(table.chatConfig.id);

  if (Array.isArray(chatConfigs) && chatConfigs.length > 0) {
    return chatConfigs;
  }

  return [];
}
