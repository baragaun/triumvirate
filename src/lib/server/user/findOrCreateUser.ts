import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import { findUserByName } from '$lib/server/user/findUserByName'
import { createUser } from '$lib/server/user/createUser'

export async function findOrCreateUser(
  id: string | null | undefined,
  username: string | null | undefined,
): Promise<User | null> {
  console.log('findOrCreateUser called with id:', id, 'username:', username);
  if (id) {
    console.log('Looking for user with ID:', id);
    const user = await findUser(id);
    if (user) {
      console.log('Found user by ID:', user.id, 'Name:', user.username);
      return user;
    }
    console.log('User not found by ID:', id);
  }

  const user = await findUserByName(username || 'guest');
  if (user) {
    return user;
  }

  const props: Partial<User> = {
    username: username || 'guest',
  };

  return createUser(props);
}
