import { error } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { ChatUiData } from '$lib/types'

export async function load({ params }): Promise<ChatUiData> {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    if (!params.id) {
      return { error: 'invalid-chat-id' };
    }

    return operations.chat.findChatUiData(params.id);
  } catch (err) {
    console.error('Error loading chat:', err);
    throw error(500, 'Failed to load chat');
  }
}
