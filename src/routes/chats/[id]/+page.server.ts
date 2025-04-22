import { error } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { ChatUiData } from '$lib/types'

export async function load({ params, url }): Promise<ChatUiData> {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    if (!params.id) {
      return { error: 'invalid-chat-id' };
    }

    const chatUiData = await operations.chat.findChatUiData(params.id);

    // Add guestUserName from URL if present
    const guestUserName = url.searchParams.get('username');
    if (guestUserName) {
      chatUiData.guestUserName = guestUserName;
    }

    return chatUiData;
  } catch (err) {
    console.error('Error loading chat:', err);
    throw error(500, 'Failed to load chat');
  }
}
