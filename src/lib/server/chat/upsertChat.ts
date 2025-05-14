import { type Chat, type User } from '$lib/server/db/schema'
import { findChat } from '$lib/server/chat/findChat'
import { updateChat } from '$lib/server/chat/updateChat'
import { createChat } from '$lib/server/chat/createChat'
import type { ChangeObjectResponse, ChatInfo } from '$lib/types'

export async function upsertChat(changes: Partial<Chat>, userInfo?: Partial<User>): Promise<ChatInfo | ChangeObjectResponse<Chat>> {
  if (!changes.id) {
    throw new Error('upsertChat: ID is required to update a model.');
  }

  const existingChat = await findChat(changes.id);
  if (existingChat) {
    return updateChat(changes);
  }

  return createChat(changes, userInfo);
}
