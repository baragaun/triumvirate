import { type Chat } from '$lib/server/db/schema'
import { findChat } from '$lib/server/chat/findChat'
import { updateChat } from '$lib/server/chat/updateChat'
import { createChat } from '$lib/server/chat/createChat'

export async function upsertChat(changes: Partial<Chat>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertChat: ID is required to update a model.');
  }

  const existingChat = await findChat(changes.id);
  if (existingChat) {
    await updateChat(changes);
    return;
  }

  await createChat(changes);
}
