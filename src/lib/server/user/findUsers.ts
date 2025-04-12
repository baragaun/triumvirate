import * as table from '$lib/server/db/schema';
import { type User } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findUsers(): Promise<User[]> {
  const db = dataStore.db.get();

  const users = await db
    .select()
    .from(table.user)
    .orderBy(table.user.id);

  if (Array.isArray(users) && users.length > 0) {
    return users;
  }

  return [];
}
