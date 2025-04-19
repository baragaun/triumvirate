import * as table from '$lib/server/db/schema';
import { type Chat, type ChatMessage } from '$lib/server/db/schema';

import { generateId } from '$lib/server/helpers';
import { findOrCreateUser } from '$lib/server/user/findOrCreateUser';
import { findChat } from '$lib/server/chat/findChat';
import dataStore from '$lib/server/dataStore';
import { ChatMode, MessageRole } from '$lib/enums'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage';
import type { ChatInfo } from '$lib/types';
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'

export async function createChat(props: Partial<Chat>): Promise<ChatInfo> {
  const db = dataStore.db.get();
  const user = await findOrCreateUser(props.userId, props.userName);
  const chatId = props.id || generateId();
  const chatConfig = await findChatConfig(props.configId || 'default');

  if (!user) {
    console.error('Error creating chat: User not found');
    return { error: 'User not found' };
  }

  try {
    const values: Chat = {
      id: chatId,
      caption: props.caption || chatConfig?.caption || null,
      title: props.title || null,
      mode: props.mode || ChatMode.user,
      userId: user.id,
      userName: props.userName || null,
      llmId: props.llmId || 'unknown',
      configId: props.configId || null,
      llmInstructions: props.llmInstructions || null,
      llmTemperature: props.llmTemperature || chatConfig?.llmTemperature || null,
      llmMaxTokens: props.llmMaxTokens || chatConfig?.llmMaxTokens || null,
      feedback: null,
      rating: null,
      endedAt: null,
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
    let content = chatConfig?.welcomeMessage ||
      'Hello! I\'m your assistant. How can I help you today?';

    const messageProps: Partial<ChatMessage> = {
      chatId: chatId,
      role: MessageRole.system,
      sendToLlm: false,
      sendToUser: true,
      content: content,
    };
    const createChatMessageResponse = await createChatMessage(messageProps, false);
    if (createChatMessageResponse.error) {
      console.error('Error creating chat message:', createChatMessageResponse.error);
      return { error: 'Failed to create chat message' };
    }

    if (createChatMessageResponse.chatMessages?.length !== 1) {
      chatMessages.push(createChatMessageResponse.chatMessages![0]);
    }

    return { chat, chatConfig, chatMessages };
  } catch (error) {
    console.error('Error creating chat:', error);
    return { error: 'system error' };
  }
}
