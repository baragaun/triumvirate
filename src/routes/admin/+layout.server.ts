import { redirect } from '@sveltejs/kit';
import type { LocalsData } from '$lib/types'

export const load = async ({ locals }: { locals: LocalsData }) => {
  if (!locals.user || !locals.user?.isAdmin) {
    throw redirect(302, '/login?redirectTo=/admin/chat-configs');
  }

  return { user: locals.user };
};
