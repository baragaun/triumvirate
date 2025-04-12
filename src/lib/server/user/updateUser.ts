import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { User } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function updateUser(changes: Partial<User>): Promise<void> {
  const db = dataStore.db.get();

  if (!changes.id) {
    throw new Error('User ID is required to update a user.');
  }

  try {
    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.user)
      .set(updateValues)
      .where(eq(table.user.id, changes.id));
  } catch (error) {
    console.error('Error updating user:', error);
  }
}
