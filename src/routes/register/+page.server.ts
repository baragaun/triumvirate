import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import dataStore from '$lib/server/dataStore';
import { createUser } from '$lib/server/user/createUser';

export const load: PageServerLoad = async (event) => {
  // If user is already logged in, redirect to home page
  if (event.locals.user) {
    return redirect(302, '/');
  }
  return {};
};

export const actions: Actions = {
  register: async (event) => {
    const db = dataStore.db.get();
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validate input
    if (!validateUsername(username)) {
      return fail(400, { message: 'Invalid username (min 3, max 31 characters, alphanumeric only)' });
    }
    if (!validatePassword(password)) {
      return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
    }
    if (password !== confirmPassword) {
      return fail(400, { message: 'Passwords do not match' });
    }

    // Check if username already exists
    const existingUsers = await db
      .select()
      .from(table.user)
      .where(eq(table.user.username, username));

    if (existingUsers.length > 0) {
      return fail(400, { message: 'Username already taken' });
    }

    try {
      console.log('Creating user with username:', username);

      const user = await createUser({
        username,
      }, password);

      if (!user) {
        console.error('Failed to create user');
        return fail(500, { message: 'Failed to create user account. Please try again.' });
      }

      const userId = user.id;
      console.log('User created successfully with ID:', userId);

      // Create session and set cookie
      try {
        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, userId);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        console.log('Session created successfully');
      } catch (sessionError) {
        console.error('Error creating session:', sessionError);
        // User was created but session failed - we can still redirect to login
        console.log('Redirecting to login page with success message');
        return redirect(302, '/login?message=Registration successful. Please log in.');
      }

      return redirect(302, '/chats');
    } catch (error) {
      // Check if the error is a redirect by looking at its properties
      if (error && typeof error === 'object' && 'location' in error && 'status' in error) {
        // This is likely a redirect, just pass it through
        console.log('Handling redirect:', error);
        throw error;
      } else {
        // This is a real error
        console.error('Registration error:', error);
        // Provide more detailed error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return fail(500, { message: `Registration failed: ${errorMessage}` });
      }
    }
  },
};

function generateUserId() {
  // ID with 120 bits of entropy, or about the same as UUID v4.
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCase(bytes);
}

function validateUsername(username: unknown): username is string {
  return (
    typeof username === 'string' &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[a-z0-9_-]+$/.test(username)
  );
}

function validatePassword(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length >= 6 &&
    password.length <= 255
  );
}
