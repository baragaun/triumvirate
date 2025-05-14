import type { RequestEvent } from '@sveltejs/kit'

export const load = async ({ locals }: RequestEvent) => {
  // Return the user data for debugging
  return {
    user: locals.user
  };
};
