import * as table from '$lib/server/db/schema';
import { type LlmContext } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findLlmContexts(): Promise<LlmContext[]> {
  const db = dataStore.db.get();

  const llmContexts = await db
    .select()
    .from(table.llmContext)
    .orderBy(table.llmContext.id);

  if (Array.isArray(llmContexts) && llmContexts.length > 0) {
    return llmContexts;
  }

  return [];
}
