import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function endChat(chatId: string, feedback?: string, rating?: number): Promise<void> {
  const db = dataStore.db.get();

  await db.update(table.chat)
    .set({
      endedAt: new Date(),
      feedback: feedback || null,
      rating: rating || null
    })
    .where(eq(table.chat.id, chatId));
}
