import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import type { ChatMessage } from '$lib/server/db/schema'
import dataStore from '$lib/server/dataStore'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import type { ChangeChatMessageResponse } from '$lib/types'
import { MessageRole } from '$lib/enums'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'

export async function updateChatMessage(
  changes: Partial<ChatMessage>,
  generateResponse: boolean,
): Promise<ChangeChatMessageResponse> {
  try {
    const db = dataStore.db.get();

    if (!changes.id) {
      return { error: 'ID is required.' };
    }

    // Filter out undefined or null values from the changes object
    const updateValues = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    );

    // Perform the update
    await db.update(table.chatMessage)
      .set(updateValues)
      .where(eq(table.chatMessage.id, changes.id));

    const chatMessage = await findChatMessage(changes.id);
    if (!chatMessage) {
      return { error: 'Chat message not found' };
    }

    const chatMessages: ChatMessage[] = [chatMessage];

    if (generateResponse && chatMessage?.role === MessageRole.user) {
      const response = await generateBedrockResponse(chatMessage.chatId);
      if (response.chatMessage) {
        chatMessages.push(response.chatMessage);
      }
    }

    return { chatMessages };
  } catch (error) {
    console.error('Error updating chat message:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
