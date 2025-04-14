import { type ChatConfig } from '$lib/server/db/schema'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { updateChatConfig } from '$lib/server/chatConfig/updateChatConfig'
import { createChatConfig } from '$lib/server/chatConfig/createChatConfig'
import type { ChangeObjectResponse } from '$lib/types'

export async function upsertChatConfig(changes: Partial<ChatConfig>): Promise<ChangeObjectResponse<ChatConfig>> {
  if (!changes.id) {
    throw new Error('upsertChatConfig: model ID is required to update a model.');
  }

  // console.log('upsertChatConfig:', changes);
  const existingConfig = await findChatConfig(changes.id);
  if (existingConfig) {
    return updateChatConfig(changes);
  }

  return createChatConfig(changes as ChatConfig);
}
