import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { createUser } from '$lib/server/user/createUser';
import { validatePersonName } from '$lib/helpers/validatePersonName';
import { validatePassword } from '$lib/helpers/validatePassword';
import operations from '$lib/server/operations';
import { validateEmail } from '$lib/helpers/validateEmail';

export const load: PageServerLoad = async (event) => {
  // If user is already logged in, redirect to home page
  if (event.locals.user) {
    return redirect(302, '/');
  }
  return {};
};

export const actions: Actions = {
  register: async (event) => {
    const formData = await event.request.formData();
    const name = formData.get('name') as string | null;
    const email = formData.get('email') as string | null;
    const password = formData.get('password') as string | null;
    const confirmPassword = formData.get('confirmPassword');
    const secret = formData.get('secret') as string | null;

    if (!secret || secret?.toLocaleLowerCase() !== 'mexico') {
      return fail(400, { message: 'Invalid secret' });
    }

    // Validate input
    if (!name || !validatePersonName(name)) {
      return fail(400, { message: 'Invalid name (min 3, max 31 characters, alphanumeric only)' });
    }
    if (!email || !validateEmail(email)) {
      return fail(400, { message: 'Invalid email' });
    }
    if (!password || !validatePassword(password)) {
      return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
    }
    if (password !== confirmPassword) {
      return fail(400, { message: 'Passwords do not match' });
    }

    // Check if name already exists
    const existingUser = await operations.user.findByEmail(email);

    if (existingUser) {
      return fail(400, { message: 'An account with this email already exists' });
    }

    try {
      console.log('Creating user with name:', name);

      const user = await createUser({
        name: name.trim(),
        email: email.trim(),
      }, password as string);

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
        // User was created but session failed - we can still redirect to log in
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
