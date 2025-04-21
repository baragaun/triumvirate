import { redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  // Check if user is logged in
  if (!event.locals.session) {
    return redirect(302, '/login');
  }

  // Invalidate session
  await auth.invalidateSession(event.locals.session.id);
  auth.deleteSessionTokenCookie(event);

  // Redirect to login page
  return redirect(302, '/login');
};
