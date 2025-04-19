import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/helpers'
import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import dataStore from '$lib/server/dataStore'

export async function createUser(props: Partial<User>): Promise<User | null> {
  const db = dataStore.db.get();
  const id = generateId();

  // Generate a random password hash placeholder
  // In a real system, you would hash an actual password
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const passwordHash = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  console.log('Creating user', props);

  await db.insert(table.user).values({
    id,
    name: props.name || 'anonymous',
    passwordHash, // Random placeholder password hash
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return findUser(id);
}
