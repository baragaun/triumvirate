import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type LlmContext } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findLlmContext(id: string): Promise<LlmContext> {
  const db = dataStore.db.get();

  return db
    .select()
    .from(table.llmContext)
    .where(eq(table.llmContext.id, id))
    .limit(1)
    .then(rows => rows[0] || null);
}
