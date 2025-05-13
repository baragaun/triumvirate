import type { PageServerLoad } from './$types';
import operations from '$lib/server/operations'

export const load: PageServerLoad = async (event) => {
  if (!operations.isStarted()) {
    await operations.startServer();
  }

  const defaultChatConfig = await operations.chatConfig.findDefault();

  // Simply return the user data (which may be null for non-logged in users)
  // This allows the landing page to be shown for all users
  return {
    user: event.locals.user,
    defaultChatConfig,
  };
};
