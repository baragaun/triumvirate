import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/helpers'
import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import dataStore from '$lib/server/dataStore'
import { hashPassword } from '$lib/server/auth/password';

export async function createUser(props: Partial<User>, password?: string): Promise<User | null> {
  try {
    const db = dataStore.db.get();
    const id = generateId();

    // For guests, the password is empty, and the passwordHash is null
    let passwordHash = props.passwordHash;
    if (!passwordHash && password) {
      passwordHash = await hashPassword(password);
    }

    await db.insert(table.user).values({
      id,
      name: props.name,
      email: props.email,
      passwordHash,
      isAdmin: props.isAdmin !== undefined ? props.isAdmin : false,
      isStaff: props.isStaff !== undefined ? props.isStaff : false,
      trackId: props.trackId || null,
      clientInfo: props.clientInfo ? JSON.stringify(props.clientInfo) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify the user was created
    const user = await findUser(id);
    if (!user) {
      console.error('User creation failed: User not found after insert');
      return null;
    }

    console.log('User created successfully:', { user });
    return user;
  } catch (error) {
    console.error('Error in createUser:', error);
    return null;
  }
}
