import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { User } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findUser(userId: string): Promise<User> {
  const db = dataStore.db.get();

  const rows = await db
    .select()
    .from(table.user)
    .where(eq(table.user.id, userId))
    .limit(1);

  return rows[0] || null;
}
