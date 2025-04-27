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
import { updateChat } from '$lib/server/chat/updateChat'

export async function createChat(props: Partial<Chat>): Promise<ChatInfo> {
  console.log('operations.chat.createChat called.', { props });

  const db = dataStore.db.get();
  const chatId = props.id || generateId();
  const chatConfig = await findChatConfig(props.configId || 'default');
  const user = await findOrCreateUser(props.userId, props.username);

  if (!chatConfig) {
    console.error('Error creating chat: Chat config not found', { props });
    return { error: 'Chat config not found' };
  }

  if (!chatConfig.llmId) {
    console.error('Error creating chat: Chat config has no model ID', { props, chatConfig });
    return { error: 'Chat config not found' };
  }

  if (!user) {
    console.error('Error creating chat: User not found or failed to create', { props});
    return { error: 'User not found' };
  }

  try {
    const values: Chat = {
      id: chatId,
      caption: props.caption || chatConfig?.caption || null,
      title: props.title || null,
      mode: props.mode || ChatMode.experiment,
      userId: user.id,
      username: user.username || 'guest',
      configId: props.configId || chatConfig.id,
      welcomeMessage: props.welcomeMessage || chatConfig?.welcomeMessage || null,
      llmId: props.llmId || chatConfig?.llmId,
      llmInstructions: props.llmInstructions || chatConfig?.llmInstructions || null,
      llmTemperature: props.llmTemperature || chatConfig?.llmTemperature || null,
      llmMaxTokens: props.llmMaxTokens || chatConfig?.llmMaxTokens || null,
      inputTokens: props.inputTokens ?? 0,
      outputTokens: props.outputTokens ?? 0,
      cost: props.cost ?? 0,
      metadata: props.metadata || null,
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
    const aiResponse = await generateBedrockResponse(chatId, chat);
    if (aiResponse.chatMessage) {
      aiResponse.chatMessage.sendToUser = false;
      chatMessages.push(aiResponse.chatMessage);
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
