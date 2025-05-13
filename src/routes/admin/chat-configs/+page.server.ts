import { redirect } from '@sveltejs/kit';
import type { LocalsData } from '$lib/types'
import { findChatConfigs } from '$lib/server/chatConfig/findChatConfigs';
import { findLlms } from '$lib/server/llm/findLlms';

export const load = async ({ locals }: { locals: LocalsData }) => {
  if (!locals.user || !locals.user?.isAdmin) {
    throw redirect(302, '/login?redirectTo=/admin/chat-configs');
  }

  const chatConfigs = await findChatConfigs();
  const llms = await findLlms();

  return {
    user: locals.user,
    chatConfigs,
    llms
  };
};
