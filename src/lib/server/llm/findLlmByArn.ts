import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Llm } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findLlmByArn(arn: string): Promise<Llm | null> {
  const db = dataStore.db.get();

  return db
    .select()
    .from(table.llm)
    .where(eq(table.llm.arn, arn))
    .limit(1)
    .then(rows => rows[0] || null);
}
