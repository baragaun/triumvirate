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
      description: props.description || null,
      caption: props.caption || null,
      isDefault: props.isDefault ?? false,
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
    console.error('Error creating CHAT config:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
