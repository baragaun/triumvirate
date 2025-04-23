import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import operations from '$lib/server/operations'
import { env } from '$env/dynamic/private'
import type { Llm } from '$lib/server/db/schema'

export async function GET({}: RequestEvent) {
  try {
    const llms = await operations.llm.find(true);

    return json({
      llms,
      selectedLlmId: env.BEDROCK_MODEL_ID,
    });
  } catch (error) {
    console.error('Error retrieving models:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a new model to our database
export async function POST({ request }: RequestEvent) {
  try {
    const props: Partial<Llm> = await request.json();

    // Validate required fields
    if (!props.id || !props.provider || !props.name) {
      return json({
        error: 'Missing required fields: id, provider, and name are required'
      }, { status: 400 });
    }

    const llm = await operations.llm.create(props);

    return json({ llm });
  } catch (error) {
    console.error('Error adding model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
