import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

// Get all llm contexts
export async function GET() {
  try {
    const llmContexts = await operations.llmContext.find();
    const selectedLlmContextId = llmContexts[0]?.id || 'default';

    return json({ llmContexts, selectedLlmContextId });
  } catch (error) {
    console.error('Error retrieving llm contexts:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new LLM context
export async function POST({ request }) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.instructions) {
      return json({
        error: 'Missing required fields: id and instructions are required'
      }, { status: 400 });
    }

    const id = await operations.llmContext.create({
      id: body.id,
      instructions: body.instructions,
      description: body.description,
      welcomeMessage: body.welcomeMessage,
    });

    return json({
      id
    });
  } catch (error) {
    console.error('Error creating LLM context:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
