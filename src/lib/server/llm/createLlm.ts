import * as table from '$lib/server/db/schema';
import { type Llm } from '$lib/server/db/schema'
import { generateId } from '$lib/server/helpers'
import { findLlm } from '$lib/server/llm/findLlm'
import dataStore from '$lib/server/dataStore'

export async function createLlm(params: Partial<Llm>): Promise<Llm | null> {
  const db = dataStore.db.get();
  const id = generateId();

  try {
    await db.insert(table.llm).values({
      id,
      name: params.name || '',
      arn: params.arn || '',
      provider: params.provider || '',
      description: params.description || null,
      isOnDemand: params.isOnDemand === undefined || params.isOnDemand === null ? true : params.isOnDemand,
      isActive: params.isActive === undefined || params.isActive === null ? true : params.isActive,
      isAvailable: params.isAvailable === undefined || params.isAvailable === null ? true : params.isAvailable,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return findLlm(id);
  } catch (error) {
    console.error('Error creating LLM:', error);
    return null;
  }
}
