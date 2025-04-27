import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: { locals: { user?: { id: string, isAdmin: boolean } } }) => {
  // Check if the user is logged in and is an admin
  if (!locals.user) {
    throw redirect(302, '/login?redirectTo=/admin/chats');
  }

  if (!locals.user.isAdmin) {
    throw redirect(302, '/');
  }

  return {
    user: locals.user
  };
};
