import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type ChatMessage } from '$lib/server/db/schema'

import { generateId } from '$lib/server/helpers'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import dataStore from '$lib/server/dataStore'
import { MessageRole } from '$lib/enums'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { findChat } from '$lib/server/chat/findChat'
import type { ChangeChatMessageResponse } from '$lib/types'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'

export async function createChatMessage(
  props: Partial<ChatMessage>,
  generateResponse: boolean,
): Promise<ChangeChatMessageResponse> {
  try {
    const db = dataStore.db.get();

    if (!props.chatId || !props.role || !props.content) {
      console.error('Error creating chat message: Missing required fields', props);
      return { error: 'Missing required fields: chatId, role, and content are required' };
    }

    const messageId = props.id || generateId();
    const chat = await findChat(props.chatId);

    if (!chat) {
      console.error('Error creating chat message: Chat not found', { chatId: props.chatId });
      return { error: 'Chat not found' };
    }

    const chatConfig = await findChatConfig(chat.configId || 'default');

    if (!chatConfig) {
      console.error('Error creating chat message: Chat config not found');
      return { error: 'Chat config not found' };
    }

    const values: ChatMessage = {
      id: messageId,
      chatId: props.chatId,
      role: props.role || MessageRole.user,
      content: props.content,
      iteration: props.iteration ?? null,
      feedback: props.feedback || null,
      sendToLlm: props.sendToLlm ?? true,
      sendToUser: props.sendToUser ?? true,
      replaced: props.replaced ?? false,
      sendStatus: props.sendStatus || null,
      error: props.error || null,
      llmId: props.llmId || chat.llmId || chatConfig.llmId || null,
      llmTemperature: props.llmTemperature ?? chat.llmTemperature ?? chatConfig.llmTemperature ?? null,
      llmInstructions: props.llmInstructions || chat.llmInstructions || chatConfig.llmInstructions || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Adding message to chat:', values);
    await db.insert(table.chatMessage).values(values);
    const chatMessage = await findChatMessage(messageId);

    if (!chatMessage) {
      console.error('Error creating chat message: Message not found');
      return { error: 'system-error' };
    }

    const chatMessages: ChatMessage[] = [chatMessage];

    if (generateResponse && chatMessage?.role === MessageRole.user) {
      const response = await generateBedrockResponse(props.chatId);
      if (response.chatMessage) {
        chatMessages.push(response.chatMessage);
      }
    }

    // Update the chat's updatedAt timestamp
    await db.update(table.chat)
      .set({ updatedAt: new Date() })
      .where(eq(table.chat.id, props.chatId));

    return { chatMessages };
  } catch (error) {
    console.error('Error creating chat message:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
