import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: { locals: { user?: { id: string, isAdmin: boolean } } }) => {
  // Debug output
  console.log('Admin layout server load function called');
  console.log('User in locals:', locals.user);

  // Check if the user is logged in and is an admin
  if (!locals.user) {
    console.log('No user found in locals, redirecting to login');
    throw redirect(302, '/login?redirectTo=/admin');
  }

  // console.log('User isAdmin value:', locals.user.isAdmin);
  // console.log('User isAdmin type:', typeof locals.user.isAdmin);

  if (!locals.user.isAdmin) {
    console.log('User is not an admin, redirecting to home');
    throw redirect(302, '/');
  }

  // console.log('User is an admin, proceeding to admin page');

  return {
    user: locals.user
  };
};
