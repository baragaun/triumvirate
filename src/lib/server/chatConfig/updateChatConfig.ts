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

    const existingChatConfig = await findChatConfig(changes.id);
    if (!existingChatConfig) {
      return { error: 'Chat config not found' };
    }

    if (!existingChatConfig.isDefault && changes.isDefault) {
      await db.update(table.chatConfig)
        .set({ isDefault: false });
    }

    // console.log('updateChatConfig received changes:', JSON.stringify(changes, null, 2));

    // Filter out undefined values from the changes object, but keep empty strings and other falsy values
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    updateValues.updatedAt = new Date();

    // console.log('updateValues after filtering:', JSON.stringify(updateValues, null, 2));

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
