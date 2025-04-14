import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import dataStore from '$lib/server/dataStore'

export async function deleteLlm(id: string): Promise<void> {
  const db = dataStore.db.get();

  await db
    .delete(table.llm)
    .where(eq(table.llm.id, id));
}
