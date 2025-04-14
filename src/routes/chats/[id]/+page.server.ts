import { error } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { LlmContext } from '$lib/server/db/schema'
import type { GetChatResponse } from '$lib/types'
import { MessageRole } from '$lib/enums'

export async function load({ params }): Promise<GetChatResponse> {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    const chatId = params.id;

    if (!chatId) {
      throw error(400, 'Chat ID is required');
    }

    const chat = await operations.chat.findOne(chatId);

    if (!chat) {
      return { error: 'not-found' };
    }

    const chatMessages = await operations.chatMessage.find(chatId, MessageRole.user);

    let llmContext: LlmContext | undefined = undefined;
    if (chat.llmContextId) {
      llmContext = await operations.llmContext.findOne(chat.llmContextId);
    }

    console.log('Loaded chat:', { chat, chatMessages, llmContext });

    return { chat, chatMessages, llmContext };
  } catch (err) {
    console.error('Error loading chat:', err);
    throw error(500, 'Failed to load chat');
  }
}
