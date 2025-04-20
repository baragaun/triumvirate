import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/helpers'
import type { User } from '$lib/server/db/schema'
import { findUser } from '$lib/server/user/findUser'
import dataStore from '$lib/server/dataStore'
import { hashPassword } from '$lib/server/auth/password';

export async function createUser(props: Partial<User>): Promise<User | null> {
  try {
    const db = dataStore.db.get();
    const id = generateId();

    // Use provided password hash or generate a secure one for guest users
    let passwordHash = props.passwordHash;
    if (!passwordHash) {
      // For guest users or when no password is provided, create a secure random password
      // This password can't be used to log in, but it's securely hashed
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      passwordHash = await hashPassword(randomPassword);
    }

    console.log('Creating user with ID:', id);
    console.log('Username:', props.username);

    await db.insert(table.user).values({
      id,
      username: props.username || 'guest',
      passwordHash,
      isAdmin: props.isAdmin !== undefined ? props.isAdmin : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify the user was created
    const user = await findUser(id);
    if (!user) {
      console.error('User creation failed: User not found after insert');
      return null;
    }

    console.log('User created successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error in createUser:', error);
    return null;
  }
}
