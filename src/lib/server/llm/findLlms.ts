import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Llm } from '$lib/server/db/schema'
import { saveMultipleLlms } from '$lib/server/llm/saveMultipleLlms'
import { importBedrockModels } from '$lib/server/bedrock/importBedrockModels'
import dataStore from '$lib/server/dataStore'

/**
 * Returns all (available) LLMs from the database.
 *
 * @param availableOnly
 */
export async function findLlms(availableOnly: boolean = true): Promise<Llm[]> {
  const db = dataStore.db.get();

  if (availableOnly) {
    const llms = await db
      .select()
      .from(table.llm)
      .where(eq(table.llm.isAvailable, true))
      .orderBy(table.llm.id);

    if (Array.isArray(llms) && llms.length > 0) {
      return llms;
    }
  }

  const llms = await db
    .select()
    .from(table.llm)
    .orderBy(table.llm.id);

  if (Array.isArray(llms) && llms.length > 0) {
    return llms;
  }

  const bedrockModels = await importBedrockModels();
  await saveMultipleLlms(bedrockModels);

  return bedrockModels;
}
