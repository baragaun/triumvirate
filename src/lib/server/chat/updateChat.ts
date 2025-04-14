import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Chat } from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore';
import { findChat } from '$lib/server/chat/findChat';
import type { ChangeObjectResponse } from '$lib/types';

export async function updateChat(changes: Partial<Chat>): Promise<ChangeObjectResponse<Chat>> {
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
    await db.update(table.chat)
      .set(updateValues)
      .where(eq(table.chat.id, changes.id));

    const chat = await findChat(changes.id);
    if (!chat) {
      return { error: 'Chat not found' };
    }

    return { object: chat };
  } catch (error) {
    console.error('Error updating chat:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
