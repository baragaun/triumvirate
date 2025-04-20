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
import { findLlms } from '$lib/server/llm/findLlms'

// Helper function to get a default LLM ID
async function getDefaultLlmId(): Promise<string> {
  try {
    // Try to find any active LLM
    const llms = await findLlms(true);
    if (llms.length > 0) {
      console.log('Using default LLM:', llms[0].id);
      return llms[0].id;
    }

    // If no active LLMs, try any LLM
    const allLlms = await findLlms(false);
    if (allLlms.length > 0) {
      console.log('Using inactive LLM:', allLlms[0].id);
      return allLlms[0].id;
    }

    // Last resort - use a placeholder
    console.error('No LLMs found, using placeholder');
    return 'anthropic.claude-3-haiku-20240307-v1:0';
  } catch (error) {
    console.error('Error finding default LLM:', error);
    return 'anthropic.claude-3-haiku-20240307-v1:0';
  }
}

export async function createChat(props: Partial<Chat>): Promise<ChatInfo> {
  const db = dataStore.db.get();
  console.log('Creating chat with userId:', props.userId, 'userName:', props.userName);
  const user = await findOrCreateUser(props.userId, props.userName);
  console.log('User for chat:', user ? `${user.id} (${user.username})` : 'null');
  const chatId = props.id || generateId();
  // Try to find the specified chat config or use 'default'
  let chatConfig = await findChatConfig(props.configId || 'default');

  // If no chat config is found, try to find any available chat config
  if (!chatConfig) {
    console.log('Chat config not found, searching for any available config...');
    const db = dataStore.db.get();
    const configs = await db.select().from(table.chatConfig).limit(1);
    if (configs.length > 0) {
      console.log('Found alternative chat config:', configs[0].id);
      chatConfig = configs[0];
    } else {
      console.error('No chat configs found in the database');
    }
  }

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
      userId: user.id, // Using the user ID we found or created
      userName: props.userName || null,
      llmId: props.llmId || chatConfig?.llmId || await getDefaultLlmId(),
      configId: props.configId || null,
      welcomeMessage: props.welcomeMessage || chatConfig?.welcomeMessage || null,
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
