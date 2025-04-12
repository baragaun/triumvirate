import { type Llm } from '$lib/server/db/schema'
import { findLlm } from '$lib/server/llm/findLlm'
import { updateLlm } from '$lib/server/llm/updateLlm'
import { createLlm } from '$lib/server/llm/createLlm'

export async function upsertLlm(changes: Partial<Llm>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertLlm: ID is required to update a model.');
  }

  const existingLlm = await findLlm(changes.id);
  if (existingLlm) {
    await updateLlm(changes);
    return;
  }

  await createLlm(changes);
}
