import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Llm } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function updateLlm(changes: Partial<Llm>): Promise<void> {
  const db = dataStore.db.get();

  if (!changes.id) {
    throw new Error('LLM ID is required to update a model.');
  }

  try {
    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.llm)
      .set(updateValues)
      .where(eq(table.llm.id, changes.id));
  } catch (error) {
    console.error('Error updating LLM:', error);
  }
}
