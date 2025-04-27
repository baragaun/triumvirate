import * as table from '$lib/server/db/schema';
import { eq, desc, isNull } from 'drizzle-orm'
import type { Chat } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore';

export async function findChats(userId?: string): Promise<Chat[]> {
  const db = dataStore.db.get();

  if (userId) {
    return db
      .select()
      .from(table.chat)
      .where(eq(table.chat.userId, userId))
      .orderBy(table.chat.createdAt);
  }

  return db
    .select()
    .from(table.chat)
    .orderBy(table.chat.createdAt);
}
