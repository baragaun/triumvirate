import * as table from '$lib/server/db/schema';
import { type Chat, type ChatMessage } from '$lib/server/db/schema';

import { generateId } from '$lib/server/helpers';
import { findOrCreateUser } from '$lib/server/user/findOrCreateUser';
import { findChat } from '$lib/server/chat/findChat';
import dataStore from '$lib/server/dataStore';
import { MessageRole } from '$lib/enums';
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage';
import type { CreateChatResponse } from '$lib/types';
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'

export async function createChat(props: Partial<Chat>): Promise<CreateChatResponse> {
  const db = dataStore.db.get();
  const user = await findOrCreateUser(props.userId, props.userName);
  const chatId = props.id || generateId();
  const llmContext = await findLlmContext(props.llmContextId || 'default');

  if (!user) {
    console.error('Error creating chat: User not found');
    return { error: 'User not found' };
  }

  try {
    const values: Chat = {
      id: chatId,
      userId: user.id,
      userName: props.userName || null,
      title: props.title || null,
      llmId: props.llmId || 'unknown',
      llmContextId: props.llmContextId || null,
      llmTemperature: props.llmTemperature || llmContext?.llmTemperature || null,
      llmMaxTokens: props.llmMaxTokens || llmContext?.llmMaxTokens || null,
      endedAt: null,
      feedback: null,
      rating: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('Creating chat with props:', values);
    await db.insert(table.chat).values(values);

    const chat = await findChat(chatId);

    const chatMessages: ChatMessage[] = [];

    // Sending instructions to the LLM:
    const response = await generateBedrockResponse(chatId, chat);
    if (response.chatMessage) {
      response.chatMessage.sendToUser = false;
      chatMessages.push(response.chatMessage);
    }

    // Adding welcome message:
    let content = llmContext?.welcomeMessage ||
      'Hello! I\'m your assistant. How can I help you today?';

    const messageProps: Partial<ChatMessage> = {
      chatId: chatId,
      role: MessageRole.system,
      sendToLlm: false,
      sendToUser: true,
      content: content,
    };
    const welcomeMessage = await createChatMessage(messageProps);
    if (welcomeMessage) {
      chatMessages.push(welcomeMessage);
    }

    return {
      chat,
      llmContext,
      chatMessages,
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { error: 'system error' };
  }
}
