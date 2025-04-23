import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { verifyPassword } from '$lib/server/auth/password';
import { validateUsername } from '$lib/helpers/validateUsername'
import { validatePassword } from '$lib/helpers/validatePassword'
import operations from '$lib/server/operations';

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
    const formData = await event.request.formData();
    const username = formData.get('username') as string | null;
    const password = formData.get('password') as string | null;

    // Validate input
    if (!username || !validateUsername(username)) {
      return fail(400, { message: 'Invalid username (min 3, max 31 characters, alphanumeric only)' });
    }
    if (!password || !validatePassword(password)) {
      return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
    }

    const existingUser = await operations.user.findByUsername(username);

    if (!existingUser) {
      return fail(400, { message: 'Incorrect username or password' });
    }

    // Verify password
    try {
      // Verify the password against the stored hash
      const passwordMatches = !!existingUser.passwordHash &&
        !!password &&
        await verifyPassword(existingUser.passwordHash, password as string);

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
