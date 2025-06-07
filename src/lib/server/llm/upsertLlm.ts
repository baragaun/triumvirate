import { type Llm } from '$lib/server/db/schema'
import { findLlm } from '$lib/server/llm/findLlm'
import { updateLlm } from '$lib/server/llm/updateLlm'
import { createLlm } from '$lib/server/llm/createLlm'
import { findLlmByArn } from '$lib/server/llm/findLlmByArn'

export async function upsertLlm(changes: Partial<Llm>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertLlm: ID is required to update a model.');
  }

  let existingLlm = await findLlm(changes.id);

  if (!existingLlm && changes.arn) {
    existingLlm = await findLlmByArn(changes.arn);
  }

  if (existingLlm) {
    await updateLlm(changes);
    return;
  }

  await createLlm(changes);
}
