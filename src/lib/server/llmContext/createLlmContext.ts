import * as table from '$lib/server/db/schema';
import { type LlmContext } from '$lib/server/db/schema'
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'
import dataStore from '$lib/server/dataStore'

export async function createLlmContext(props: Partial<LlmContext>): Promise<LlmContext | null> {
  const db = dataStore.db.get();

  if (!props.id) {
    throw new Error('Missing required fields: id is required');
  }

  try {
    await db.insert(table.llmContext).values({
      id: props.id || 'default',
      description: props.description || null,
      instructions: props.instructions || '',
      welcomeMessage: props.welcomeMessage || null,
      llmId: props.llmId || 'default',
      llmTemperature: props.llmTemperature || null,
      llmMaxTokens: props.llmMaxTokens || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // return findLlmContext(props.id);
    const savedContext = await findLlmContext(props.id);
    console.log('Created LLM context:', savedContext);
    return savedContext;
  } catch (error) {
    console.error('Error creating LLM context:', error);
    return null;
  }
}
