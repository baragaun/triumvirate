import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore';
import type { ChangeObjectResponse } from '$lib/types';
import { findUser } from '$lib/server/user/findUser'

export async function updateUser(changes: Partial<User>): Promise<ChangeObjectResponse<User>> {
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
    await db.update(table.user)
      .set(updateValues)
      .where(eq(table.user.id, changes.id));

    const user = await findUser(changes.id);
    if (!user) {
      return { error: 'User not found' };
    }

    return { object: user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
