import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import { findUserByEmail } from '$lib/server/user/findUserByEmail'
import { createUser } from '$lib/server/user/createUser'
import type { ClientInfo } from '$lib/types'

export async function findOrCreateUser(
  id: string | null | undefined,
  name: string | null | undefined,
  email: string | null | undefined,
  clientInfo: ClientInfo | null | undefined,
  trackId: string | null | undefined,
): Promise<User | null> {
  console.log('findOrCreateUser called:', { id, name, email, clientInfo, trackId });
  if (id) {
    console.log('Looking for user with ID:', id);
    const user = await findUser(id);
    if (user) {
      console.log('Found user by ID:', user.id, 'Name:', user.name);
      return user;
    }
    console.log('User not found by ID:', id);
  }

  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      console.log('Found user with email:', user.id, 'Email:', email);
      return user;
    }
  }

  const props: Partial<User> = {
    name,
    email,
    clientInfo: clientInfo || null,
    trackId,
  };

  return createUser(props);
}
