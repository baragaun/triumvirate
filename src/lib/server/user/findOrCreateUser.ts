import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import { findUserByName } from '$lib/server/user/findUserByName'
import { createUser } from '$lib/server/user/createUser'

export async function findOrCreateUser(
  id: string | null | undefined,
  name: string | null | undefined,
): Promise<User | null> {
  if (id) {
    const user = await findUser(id);
    if (user) {
      return user;
    }
  }

  const user = await findUserByName(name || 'anonymous');
  if (user) {
    return user;
  }

  const props: Partial<User> = {
    name: name || 'anonymous',
  };

  return createUser(props);
}
