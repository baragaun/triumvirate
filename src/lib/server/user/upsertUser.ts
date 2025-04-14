import { type User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import { updateUser } from '$lib/server/user/updateUser'
import { createUser } from '$lib/server/user/createUser'

export async function upsertUser(changes: Partial<User>): Promise<void> {
  if (!changes.id) {
    throw new Error('upsertUser: ID is required to update a model.');
  }

  const existingUser = await findUser(changes.id);
  if (existingUser) {
    await updateUser(changes);
    return;
  }

  await createUser(changes);
}
