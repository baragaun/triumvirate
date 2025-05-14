import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import { findUserByUsername } from '$lib/server/user/findUserByUsername'
import { createUser } from '$lib/server/user/createUser'
import type { ClientInfo } from '$lib/types'

export async function findOrCreateUser(
  id: string | null | undefined,
  username: string | null | undefined,
  clientInfo: ClientInfo | null | undefined,
  trackId: string | null | undefined,
): Promise<User | null> {
  console.log('findOrCreateUser called:', { id, username, clientInfo, trackId });
  if (id) {
    console.log('Looking for user with ID:', id);
    const user = await findUser(id);
    if (user) {
      console.log('Found user by ID:', user.id, 'Name:', user.username);
      return user;
    }
    console.log('User not found by ID:', id);
  }

  const user = await findUserByUsername(username || 'guest');
  if (user) {
    return user;
  }

  const props: Partial<User> = {
    username: username || 'guest',
    clientInfo: clientInfo || null,
    trackId,
  };

  return createUser(props);
}
