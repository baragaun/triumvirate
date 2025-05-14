import * as table from '$lib/server/db/schema';
import { type Chat, type ChatMessage, type User } from '$lib/server/db/schema'

import { generateId } from '$lib/server/helpers';
import { findOrCreateUser } from '$lib/server/user/findOrCreateUser';
import { findChat } from '$lib/server/chat/findChat';
import dataStore from '$lib/server/dataStore';
import { ChatMode, MessageRole } from '$lib/enums'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage';
import type { ChatInfo, ClientInfo } from '$lib/types'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'

export async function createChat(props: Partial<Chat>, userInfo?: Partial<User>): Promise<ChatInfo> {
  console.log('operations.chat.createChat called.', { props, userInfo });

  const db = dataStore.db.get();
  const chatId = props.id || generateId();
  const chatConfig = await findChatConfig(props.configId || 'default');
  const userId = userInfo?.id || props.userId;
  const username = userInfo?.username || props.username;
  const user = await findOrCreateUser(
    userId,
    username,
    userInfo?.clientInfo as ClientInfo | null,
    userInfo?.trackId,
  );

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
      feedbackButtonValue0: props.feedbackButtonValue0 || chatConfig.feedbackButtonValue0 || null,
      feedbackButtonValue1: props.feedbackButtonValue1 || chatConfig.feedbackButtonValue1 || null,
      feedbackButtonValue2: props.feedbackButtonValue2 || chatConfig.feedbackButtonValue2 || null,
      feedbackButtonValue3: props.feedbackButtonValue3 || chatConfig.feedbackButtonValue3 || null,
      feedbackButtonValue4: props.feedbackButtonValue4 || chatConfig.feedbackButtonValue4 || null,
      feedbackButtonLabel0: props.feedbackButtonLabel0 || chatConfig.feedbackButtonLabel0 || null,
      feedbackButtonLabel1: props.feedbackButtonLabel1 || chatConfig.feedbackButtonLabel1 || null,
      feedbackButtonLabel2: props.feedbackButtonLabel2 || chatConfig.feedbackButtonLabel2 || null,
      feedbackButtonLabel3: props.feedbackButtonLabel3 || chatConfig.feedbackButtonLabel3 || null,
      feedbackButtonLabel4: props.feedbackButtonLabel4 || chatConfig.feedbackButtonLabel4 || null,
      feedbackButtonTitle0: props.feedbackButtonTitle0 || chatConfig.feedbackButtonTitle0 || null,
      feedbackButtonTitle1: props.feedbackButtonTitle1 || chatConfig.feedbackButtonTitle1 || null,
      feedbackButtonTitle2: props.feedbackButtonTitle2 || chatConfig.feedbackButtonTitle2 || null,
      feedbackButtonTitle3: props.feedbackButtonTitle3 || chatConfig.feedbackButtonTitle3 || null,
      feedbackButtonTitle4: props.feedbackButtonTitle4 || chatConfig.feedbackButtonTitle4 || null,
      feedbackButtonIcon0: props.feedbackButtonIcon0 || chatConfig.feedbackButtonIcon0 || null,
      feedbackButtonIcon1: props.feedbackButtonIcon1 || chatConfig.feedbackButtonIcon1 || null,
      feedbackButtonIcon2: props.feedbackButtonIcon2 || chatConfig.feedbackButtonIcon2 || null,
      feedbackButtonIcon3: props.feedbackButtonIcon3 || chatConfig.feedbackButtonIcon3 || null,
      feedbackButtonIcon4: props.feedbackButtonIcon4 || chatConfig.feedbackButtonIcon4 || null,
      feedbackButtonLlmText0: props.feedbackButtonLlmText0 || chatConfig.feedbackButtonLlmText0 || null,
      feedbackButtonLlmText1: props.feedbackButtonLlmText1 || chatConfig.feedbackButtonLlmText1 || null,
      feedbackButtonLlmText2: props.feedbackButtonLlmText2 || chatConfig.feedbackButtonLlmText2 || null,
      feedbackButtonLlmText3: props.feedbackButtonLlmText3 || chatConfig.feedbackButtonLlmText3 || null,
      feedbackButtonLlmText4: props.feedbackButtonLlmText4 || chatConfig.feedbackButtonLlmText4 || null,
      feedbackQuestion0: props.feedbackQuestion0 || chatConfig.feedbackQuestion0 || null,
      feedbackQuestion1: props.feedbackQuestion1 || chatConfig.feedbackQuestion1 || null,
      feedbackQuestion2: props.feedbackQuestion2 || chatConfig.feedbackQuestion2 || null,
      feedbackQuestion3: props.feedbackQuestion3 || chatConfig.feedbackQuestion3 || null,
      feedbackQuestion4: props.feedbackQuestion4 || chatConfig.feedbackQuestion4 || null,
      feedbackQuestion5: props.feedbackQuestion5 || chatConfig.feedbackQuestion5 || null,
      feedbackQuestion6: props.feedbackQuestion6 || chatConfig.feedbackQuestion6 || null,
      feedbackQuestion7: props.feedbackQuestion7 || chatConfig.feedbackQuestion7 || null,
      feedbackQuestion8: props.feedbackQuestion8 || chatConfig.feedbackQuestion8 || null,
      feedbackQuestion9: props.feedbackQuestion9 || chatConfig.feedbackQuestion9 || null,
      feedbackAnswer0: props.feedbackAnswer0 || null,
      feedbackAnswer1: props.feedbackAnswer1 || null,
      feedbackAnswer2: props.feedbackAnswer2 || null,
      feedbackAnswer3: props.feedbackAnswer3 || null,
      feedbackAnswer4: props.feedbackAnswer4 || null,
      feedbackAnswer5: props.feedbackAnswer5 || null,
      feedbackAnswer6: props.feedbackAnswer6 || null,
      feedbackAnswer7: props.feedbackAnswer7 || null,
      feedbackAnswer8: props.feedbackAnswer8 || null,
      feedbackAnswer9: props.feedbackAnswer9 || null,
      endedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('Creating chat with props:', values);
    await db.insert(table.chat).values(values);

    const chat = await findChat(chatId);

    const chatMessages: ChatMessage[] = [];

    // Adding welcome message:
    let content = chatConfig?.welcomeMessage ||
      'Hello! I\'m your assistant. How can I help you today?';

    const messageProps: Partial<ChatMessage> = {
      chatId: chatId,
      role: MessageRole.platform,
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
