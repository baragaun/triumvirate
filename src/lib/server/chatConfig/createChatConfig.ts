import * as table from '$lib/server/db/schema';
import { type ChatConfig } from '$lib/server/db/schema'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import dataStore from '$lib/server/dataStore'
import type { ChangeObjectResponse } from '$lib/types'
import { generateId } from '$lib/server/helpers'

export async function createChatConfig(props: ChatConfig): Promise<ChangeObjectResponse<ChatConfig>> {
  try {
    const db = dataStore.db.get();

    if (!props.id) {
      return { error: 'ID is required.' };
    }

    if (!props.llmId) {
      return { error: 'llmId is required.' };
    }

    if (props.isDefault) {
      await db.update(table.chatConfig).set({ isDefault: false });
    }

    const values: ChatConfig = {
      id: props.id || generateId(),
      isDefault: props.isDefault ?? false,
      description: props.description || null,
      caption: props.caption || null,
      introduction: props.introduction || null,
      feedbackButtonLabel0: props.feedbackButtonLabel0 || 'Helpful',
      feedbackButtonLabel1: props.feedbackButtonLabel1 || 'Not Helpful',
      feedbackButtonLabel2: props.feedbackButtonLabel2 || 'Wrong',
      feedbackButtonLabel3: props.feedbackButtonLabel3 || null,
      feedbackButtonLabel4: props.feedbackButtonLabel4 || null,
      feedbackButtonValue0: props.feedbackButtonValue0 || 'helpful',
      feedbackButtonValue1: props.feedbackButtonValue1 || 'not-helpful',
      feedbackButtonValue2: props.feedbackButtonValue2 || 'wrong',
      feedbackButtonValue3: props.feedbackButtonValue3 || null,
      feedbackButtonValue4: props.feedbackButtonValue4 || null,
      feedbackButtonLlmText0: props.feedbackButtonLlmText0 || 'The user found your response helpful.',
      feedbackButtonLlmText1: props.feedbackButtonLlmText1 || 'The user did not find your response helpful.',
      feedbackButtonLlmText2: props.feedbackButtonLlmText2 || 'The user thought your response is wrong.',
      feedbackButtonLlmText3: props.feedbackButtonLlmText3 || null,
      feedbackButtonLlmText4: props.feedbackButtonLlmText4 || null,
      feedbackQuestion0: props.feedbackQuestion0 || null,
      feedbackQuestion1: props.feedbackQuestion1 || null,
      feedbackQuestion2: props.feedbackQuestion2 || null,
      feedbackQuestion3: props.feedbackQuestion3 || null,
      feedbackQuestion4: props.feedbackQuestion4 || null,
      feedbackQuestion5: props.feedbackQuestion5 || null,
      feedbackQuestion6: props.feedbackQuestion6 || null,
      feedbackQuestion7: props.feedbackQuestion7 || null,
      feedbackQuestion8: props.feedbackQuestion8 || null,
      feedbackQuestion9: props.feedbackQuestion9 || null,
      welcomeMessage: props.welcomeMessage || null,
      llmId: props.llmId,
      llmInstructions: props.llmInstructions,
      llmTemperature: props.llmTemperature || .5,
      llmMaxTokens: props.llmMaxTokens || 1000,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
    await db.insert(table.chatConfig).values(values);

    const chatConfig = await findChatConfig(props.id);

    return { object: chatConfig };
  } catch (error) {
    console.error('Error creating chat config:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
