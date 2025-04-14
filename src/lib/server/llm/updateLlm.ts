import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { type Llm } from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore';
import { findLlm } from '$lib/server/llm/findLlm';
import type { ChangeObjectResponse } from '$lib/types';

export async function updateLlm(changes: Partial<Llm>): Promise<ChangeObjectResponse<Llm>> {
  try {
    const db = dataStore.db.get();

    if (!changes.id) {
      return { error: 'ID is required.' };
    }

    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.llm)
      .set(updateValues)
      .where(eq(table.llm.id, changes.id));

    const llm = await findLlm(changes.id);
    if (!llm) {
      return { error: 'Model not found' };
    }

    return { object: llm };
  } catch (error) {
    console.error('Error updating model:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
