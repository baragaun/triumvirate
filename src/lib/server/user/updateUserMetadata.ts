import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '$lib/server/db/schema';
import dataStore from '$lib/server/dataStore';
import type { ChangeObjectResponse, ChatMetadata } from '$lib/types'
import { findUser } from '$lib/server/user/findUser'

export async function updateUserMetadata(
  userId: string,
  metadata: Partial<ChatMetadata>,
  user?: User | null,
): Promise<ChangeObjectResponse<User>> {
  if (!userId) {
    return { error: 'userId is required.' };
  }

  if (!metadata) {
    return { error: 'metadata is required.' };
  }

  try {
    const db = dataStore.db.get();

    if (!user) {
      user = await findUser(userId);
    }

    const changes: Partial<User> = {
      metadata: user.metadata
        ? { ...user.metadata, ...metadata }
        : metadata,
    };

    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.user)
      .set(updateValues)
      .where(eq(table.user.id, userId));

    const updatedUser = await findUser(userId);
    if (!updatedUser) {
      return { error: 'User not found' };
    }

    return { object: updatedUser };
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
