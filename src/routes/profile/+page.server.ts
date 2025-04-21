import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // If user is not logged in, redirect to login page
  if (!event.locals.user) {
    return redirect(302, '/login?redirectTo=/profile');
  }
  
  // Return user data
  return {
    user: event.locals.user
  };
};
