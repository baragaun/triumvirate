import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { GetChatResponse } from '$lib/types'

export async function GET({ params }) {
  try {
    const id = params.id;

    if (!id) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const chat = await operations.chat.findOne(id);

    if (!chat) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    const chatMessages = await operations.chatMessage.find(id);
    const llmContext = await operations.llmContext.findOne(chat.llmContextId || 'default');

    const data: GetChatResponse = { chat, chatMessages, llmContext };

    return json(data);
  } catch (error) {
    console.error('Error retrieving model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
