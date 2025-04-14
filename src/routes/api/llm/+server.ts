import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations'
import { env } from '$env/dynamic/private'

export async function GET() {
  try {
    const llms = await operations.llm.find(true);

    return json({
      llms,
      selectedLlmId: env.BEDROCK_MODEL_ID,
    });
  } catch (error) {
    console.error('Error retrieving llms:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a new model to our database
export async function POST({ request }) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.llmId || !body.provider || !body.name) {
      return json({
        error: 'Missing required fields: llmId, provider, and name are required'
      }, { status: 400 });
    }

    const id = await operations.llm.create({
      id: body.llmId,
      provider: body.provider,
      description: body.description
    });

    return json({
      id
    });
  } catch (error) {
    console.error('Error adding model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
