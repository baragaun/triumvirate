import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  // Check if there's a userName parameter (for guest users)
  const userName = event.url.searchParams.get('userName');

  // For the chats index page, if user is not logged in, redirect to home page
  // This prevents the redirect loop when clicking on Home in the navigation
  if (event.url.pathname === '/chats' && !event.locals.user && !userName) {
    return redirect(302, '/');
  }

  // For other chat pages, if user is not logged in and no userName is provided, redirect to login page
  if (event.url.pathname !== '/chats' && !event.locals.user && !userName) {
    return redirect(302, '/login?redirectTo=' + event.url.pathname);
  }

  return {
    guestUserName: userName
  };
};
