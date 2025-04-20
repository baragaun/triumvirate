import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  // Simply return the user data (which may be null for non-logged in users)
  // This allows the landing page to be shown for all users
  return {
    user: event.locals.user
  };
};
