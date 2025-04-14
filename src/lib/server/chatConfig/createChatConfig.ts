import * as table from '$lib/server/db/schema';
import { type ChatConfig } from '$lib/server/db/schema'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import dataStore from '$lib/server/dataStore'
import type { ChangeObjectResponse } from '$lib/types'

export async function createChatConfig(props: ChatConfig): Promise<ChangeObjectResponse<ChatConfig>> {
  try {
    const db = dataStore.db.get();

    if (!props.id) {
      return { error: 'ID is required.' };
    }

    await db.insert(table.chatConfig).values(props);

    const chatConfig = await findChatConfig(props.id);

    return { object: chatConfig };
  } catch (error) {
    console.error('Error creating CHAT config:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
