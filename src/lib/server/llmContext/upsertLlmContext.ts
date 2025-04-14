import { type LlmContext } from '$lib/server/db/schema'
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'
import { updateLlmContext } from '$lib/server/llmContext/updateLlmContext'
import { createLlmContext } from '$lib/server/llmContext/createLlmContext'

export async function upsertLlmContext(changes: Partial<LlmContext>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertLlmContext: model ID is required to update a model.');
  }

  // console.log('upsertLlmContext:', changes);
  const existingContext = await findLlmContext(changes.id);
  if (existingContext) {
    await updateLlmContext(changes);
    return;
  }

  await createLlmContext(changes);
}
