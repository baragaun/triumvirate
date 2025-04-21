import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  // Check if there's a userName parameter (for guest users)
  const guestUserName = event.url.searchParams.get('userName');

  return {
    user: event.locals.user,
    guestUserName
  };
};
