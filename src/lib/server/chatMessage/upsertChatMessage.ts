import { type ChatMessage } from '$lib/server/db/schema'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage'

export async function upsertChatMessage(changes: Partial<ChatMessage>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertChatMessage: ID is required to update a model.');
  }

  const existingChatMessage = await findChatMessage(changes.id);
  if (existingChatMessage) {
    await updateChatMessage(changes);
    return;
  }

  await createChatMessage(changes);
}
