import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  // Check if there's a username parameter (for guest users)
  const guestUserName = event.url.searchParams.get('username');

  return {
    user: event.locals.user,
    guestUserName
  };
};
