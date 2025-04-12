import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteLlmContext(id: string): Promise<void> {
  const db = dataStore.db.get();

  await db
    .delete(table.llmContext)
    .where(eq(table.llmContext.id, id));
}
