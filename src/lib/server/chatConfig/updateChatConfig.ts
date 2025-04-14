import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { type ChatConfig } from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore';
import type { ChangeObjectResponse } from '$lib/types';
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig';

export async function updateChatConfig(changes: Partial<ChatConfig>): Promise<ChangeObjectResponse<ChatConfig>> {
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
    await db.update(table.chatConfig)
      .set(updateValues)
      .where(eq(table.chatConfig.id, changes.id));

    const chatConfig = await findChatConfig(changes.id);
    if (!chatConfig) {
      return { error: 'Chat config not found' };
    }

    return { object: chatConfig };
  } catch (error) {
    console.error('Error updating ChatConfig:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
