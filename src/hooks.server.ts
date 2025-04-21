import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import operations from '$lib/server/operations';

export const handle: Handle = async ({ event, resolve }) => {
	// Authentication middleware
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await auth.validateSessionToken(sessionToken);

		if (session) {
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} else {
			auth.deleteSessionTokenCookie(event);
		}

		event.locals.user = user;
		event.locals.session = session;
	}

	return resolve(event);
};

export const startApp = async () => {
  console.log('Server starting, loading chat configurations...');
  try {
    await operations.startServer();
  } catch (error) {
    console.error('Error loading chat configurations:', error);
    return { chatConfigs: [] };
  }
};
