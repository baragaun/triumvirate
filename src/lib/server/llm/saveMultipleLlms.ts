import * as table from '$lib/server/db/schema';
import { type Llm } from '$lib/server/db/schema'
import { generateId } from '$lib/server/helpers'
import dataStore from '$lib/server/dataStore'

export async function saveMultipleLlms(llms: Llm[]): Promise<void> {
  const db = dataStore.db.get();

  try {
    await db.delete(table.llm);

    for (const llm of llms) {
      await db.insert(table.llm).values({
        id: llm.id || generateId(),
        name: llm.name || '',
        provider: llm.provider || '',
        description: llm.description || null,
        isActive: llm.isActive,
        isOnDemand: llm.isOnDemand,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    //
    // const reloadedLlms = await db
    //   .select()
    //   .from(table.llm)
    //   .orderBy(table.llm.id);
    // console.log('Reloaded llms:', reloadedLlms);
  } catch (error) {
    console.error('Error saving llms:', error);
    throw error;
  }
}
