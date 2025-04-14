import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

// Get a specific LLM context
export async function GET({ params }) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'LLM context ID is required'
      }, { status: 400 });
    }

    const llmContext = await operations.llmContext.findOne(id);

    if (!llmContext) {
      return json({
        error: 'LLM context not found'
      }, { status: 404 });
    }

    return json({ llmContext });
  } catch (error) {
    console.error('Error retrieving LLM context:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update an LLM context
export async function PUT({ params, request }) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'LLM context ID is required'
      }, { status: 400 });
    }

    const body = await request.json();

    await operations.llmContext.update({
      id,
      instructions: body.instructions,
      description: body.description
    });

    return json({});
  } catch (error) {
    console.error('Error updating LLM context:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete an LLM context
export async function DELETE({ params }) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'LLM context ID is required'
      }, { status: 400 });
    }

    await operations.llmContext.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting LLM context:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
