import operations from '$lib/server/operations'
import { error, type RequestEvent } from '@sveltejs/kit'
import type { ChatConfig, User } from '$lib/server/db/schema'

export interface ThisData {
  chatConfig: ChatConfig;
  user: Partial<User> | null;
}

export async function load({ params, request, locals }: RequestEvent): Promise<ThisData> {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    const httpHeaders: Record<string, string> = {};

    for (const [key, value] of request.headers.entries()) {
      httpHeaders[key] = value;
    }

    const name = params.name;

    const chatConfig = await operations.chatConfig.findByName(name);
    const user: Partial<User> = { ...locals.user }
    if (httpHeaders) {
      user.clientInfo = {
        headers: httpHeaders,
      };
    }
    return { chatConfig, user };
  } catch (err) {
    console.error('routes/start/[name]: error', err);
    throw error(500, 'System error');
  }
}
