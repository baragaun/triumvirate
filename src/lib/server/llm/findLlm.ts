import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Llm } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

const cache = new Map<string, Llm>();

export async function findLlm(id: string): Promise<Llm> {
  if (cache.has(id)) {
    return cache.get(id) as Llm;
  }

  const db = dataStore.db.get();

  const llm = await db
    .select()
    .from(table.llm)
    .where(eq(table.llm.id, id))
    .limit(1)
    .then(rows => rows[0] || null);

  cache.set(id, llm);

  return llm;
}
