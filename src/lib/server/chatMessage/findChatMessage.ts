import { eq } from 'drizzle-orm'
import * as table from '$lib/server/db/schema';
import type { ChatMessage } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findChatMessage(id: string): Promise<ChatMessage | null> {
  const db = dataStore.db.get();

  const rows = await db
    .select()
    .from(table.chatMessage)
    .where(eq(table.chatMessage.id, id))
    .limit(1);

  return rows[0] || null;
}
