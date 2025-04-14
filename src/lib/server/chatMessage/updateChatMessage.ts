import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { ChatMessage } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function updateChatMessage(changes: Partial<ChatMessage>): Promise<void> {
  const db = dataStore.db.get();

  if (!changes.id) {
    throw new Error('ChatMessage ID is required to update a chat message.');
  }

  try {
    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.chatMessage)
      .set(updateValues)
      .where(eq(table.chatMessage.id, changes.id));
  } catch (error) {
    console.error('Error updating chat message:', error);
  }
}
