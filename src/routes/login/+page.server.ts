import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import dataStore from '$lib/server/dataStore';
import { verifyPassword } from '$lib/server/auth/password';

export const load: PageServerLoad = async (event) => {
  // If user is already logged in, redirect to home page
  if (event.locals.user) {
    return redirect(302, '/');
  }

  // Check for success message from registration
  const message = event.url.searchParams.get('message');

  return {
    message: message || null
  };
};

export const actions: Actions = {
  login: async (event) => {
    const db = dataStore.db.get();
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    // Validate input
    if (!validateUsername(username)) {
      return fail(400, { message: 'Invalid username (min 3, max 31 characters, alphanumeric only)' });
    }
    if (!validatePassword(password)) {
      return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
    }

    // Find user by username
    const results = await db
      .select()
      .from(table.user)
      .where(eq(table.user.username, username));

    const existingUser = results.at(0);
    if (!existingUser) {
      return fail(400, { message: 'Incorrect username or password' });
    }

    // Verify password
    try {
      // Verify the password against the stored hash
      const passwordMatches = await verifyPassword(existingUser.passwordHash, password);

      if (!passwordMatches) {
        return fail(400, { message: 'Incorrect username or password' });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return fail(400, { message: 'Authentication error' });
    }

    // Create session and set cookie
    const sessionToken = auth.generateSessionToken();
    const session = await auth.createSession(sessionToken, existingUser.id);
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

    // Redirect to chats page after successful login, unless a specific redirect is requested
    const redirectTo = event.url.searchParams.get('redirectTo') || '/chats';
    return redirect(302, redirectTo);
  },
};

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
