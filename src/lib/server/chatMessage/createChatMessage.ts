import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm'
import { type ChatMessage } from '$lib/server/db/schema'

import { generateId } from '$lib/server/helpers'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import dataStore from '$lib/server/dataStore'

export async function createChatMessage(props: Partial<ChatMessage>): Promise<ChatMessage | null> {
  const db = dataStore.db.get();

  if (!props.chatId || !props.role || !props.content) {
    throw new Error('Missing required fields: chatId, role, and content are required');
  }

  try {
    const messageId = props.id || generateId();

    console.log('Adding message to chat:', props);
    await db.insert(table.chatMessage).values({
      id: messageId,
      chatId: props.chatId,
      role: props.role,
      sendToLlm: props.sendToLlm ?? true,
      sendToUser: props.sendToUser ?? true,
      content: props.content,
      status: props.status,
      error: props.error,
      feedback: props.feedback || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update the chat's updatedAt timestamp
    await db.update(table.chat)
      .set({ updatedAt: new Date() })
      .where(eq(table.chat.id, props.chatId));

    return findChatMessage(messageId);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return null;
  }
}
