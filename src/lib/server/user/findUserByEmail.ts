import * as table from '$lib/server/db/schema';
import { sql } from 'drizzle-orm'
import type { User } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = dataStore.db.get();

  try {
    const users = await db
      .select()
      .from(table.user)
      .where(sql`LOWER(${table.user.email}) = LOWER(${email})`);

    if (users.length === 0) {
      return null;
    } else if (users.length === 1) {
      console.log(`Found user with email "${email}".`, users[0]);
      return users[0];
    } else {
      console.warn(`Found ${users.length} users with email "${email}" (case-insensitive). Using the first match.`);
      return users[0];
    }
  } catch (error) {
    // Fallback to direct SQL if there's an issue with the query builder
    console.error('Error in findUserByName with query builder:', error);
    return null;
  }
}
