import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { Chat } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function updateChat(changes: Partial<Chat>): Promise<void> {
  const db = dataStore.db.get();

  if (!changes.id) {
    throw new Error('Chat ID is required to update a chat.');
  }

  try {
    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.chat)
      .set(updateValues)
      .where(eq(table.chat.id, changes.id));
  } catch (error) {
    console.error('Error updating chat:', error);
  }
}
