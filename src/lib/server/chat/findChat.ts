import { eq } from 'drizzle-orm'
import * as table from '$lib/server/db/schema';
import type { Chat } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findChat(id: string): Promise<Chat | null> {
  const db = dataStore.db.get();

  const rows = await db
    .select()
    .from(table.chat)
    .where(eq(table.chat.id, id))
    .limit(1);

  return rows[0] || null;
}
