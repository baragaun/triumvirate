import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm'
import { type Chat, type ChatMessage } from '$lib/server/db/schema'

import { generateId } from '$lib/server/helpers'
import { findChatMessage } from '$lib/server/chatMessage/findChatMessage'
import dataStore from '$lib/server/dataStore'
import { ChatMode, MessageRole } from '$lib/enums'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { findChat } from '$lib/server/chat/findChat'
import type { ChangeChatMessageResponse, ChatMetadata } from '$lib/types'
import { generateBedrockResponse } from '$lib/server/bedrock/generateBedrockResponse'
import { updateUserMetadata } from '$lib/server/user/updateUserMetadata'

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

    // The LLM may have changed the stage of the chat with this response.
    let stage = props.stage || chat.stage || null;
    if (
      props.role === MessageRole.assistant &&
      props.metadata &&
      (props.metadata as ChatMetadata).chat_stage
    ) {
      stage = (props.metadata as ChatMetadata).chat_stage || null
    }

    const values: ChatMessage = {
      id: messageId,
      chatId: props.chatId,
      role: props.role || MessageRole.user,
      stage,
      content: props.content,
      iteration: (!props.iteration && props.iteration !== 0) || isNaN(props.iteration)
        ? null
        : (props.iteration ?? null),
      sendToLlm: props.sendToLlm ?? true,
      sendToUser: props.sendToUser ?? true,
      replaced: false,
      sendStatus: props.sendStatus || null,
      error: props.error || null,
      llmId: props.llmId || null,
      llmTemperature: props.llmTemperature || null,
      llmInstructions: props.llmInstructions || null,
      inputTokens: props.inputTokens ?? 0,
      outputTokens: props.outputTokens ?? 0,
      cost: props.cost ?? 0,
      metadata: props.metadata || null,
      feedback: props.feedback || null,
      rating: props.rating ?? null,
      responseTime: props.responseTime ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only in `tuning` mode can the user change these values:
    if (chat.mode === ChatMode.tuning) {
      values.replaced = props.replaced ?? false;
      values.iteration = props.iteration ?? null;
      values.llmId = props.llmId || chat.llmId || chatConfig.llmId || null;
      values.llmTemperature = props.llmTemperature ?? chat.llmTemperature ?? chatConfig.llmTemperature ?? null;
      values.llmInstructions = props.llmInstructions || chat.llmInstructions || chatConfig.llmInstructions || null;
    }

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

    const chatChanges: Partial<Chat> = {
      updatedAt: new Date(),
    };

    if (chatMessage.role === MessageRole.assistant) {
      if (!isNaN(chatMessage.inputTokens) && chatMessage.inputTokens > 0) {
        chatChanges.inputTokens = (chat.inputTokens || 0) + chatMessage.inputTokens;
      }
      if (!isNaN(chatMessage.outputTokens) && chatMessage.outputTokens > 0) {
        chatChanges.outputTokens = (chat.outputTokens || 0) + chatMessage.outputTokens;
      }
      if (!isNaN(chatMessage.cost) && chatMessage.cost > 0) {
        chatChanges.cost = (chat.cost || 0) + chatMessage.cost;
      }
      if (props.metadata) {
        if (chat.metadata) {
          chatChanges.metadata = {
            ...chat.metadata,
            ...props.metadata,
            updatedAt: new Date(),
          };
        } else {
          chatChanges.metadata = props.metadata;
        }
      }
    }

    if (stage && stage !== chat.stage) {
      chatChanges.stage = stage;
    }

    await db.update(table.chat)
      .set(chatChanges)
      .where(eq(table.chat.id, props.chatId));

    if (props.metadata) {
      if (chat.userId) {
        await updateUserMetadata(chat.userId, props.metadata);
      }
    }

    return { chatMessages };
  } catch (error) {
    console.error('Error creating chat message:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
