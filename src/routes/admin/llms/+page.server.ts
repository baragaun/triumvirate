import { redirect, type RequestEvent } from '@sveltejs/kit'

export const load = async ({ locals }: RequestEvent) => {
  if (!locals.user || !locals.user?.isAdmin) {
    throw redirect(302, '/login?redirectTo=/admin/chat-configs');
  }

  return { user: locals.user };
};

import operations from '$lib/server/operations';
import { fail } from '@sveltejs/kit';

export const actions = {
  importModels: async () => {
    console.log('POST importModels called.')
    try {
      await operations.bedrock.loadModels();
    } catch (error: unknown) {
      console.error('Error importing models:', error);
      return fail(500, { message: error instanceof Error ? error.message : String(error) });
    }

    return { success: true };
  }
};
