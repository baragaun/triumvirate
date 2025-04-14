import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { Llm } from '$lib/server/db/schema'

// Get a specific model
export async function GET({ params }) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Model ID is required'
      }, { status: 400 });
    }

    const model = await operations.llm.findOne(id);

    if (!model) {
      return json({
        error: 'Model not found'
      }, { status: 404 });
    }

    return json({
      model
    });
  } catch (error) {
    console.error('Error retrieving model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a model
export async function PUT({ params, request }) {
  try {
    if (!params.id) {
      return json({
        error: 'Model ID is required'
      }, { status: 400 });
    }

    const changes: Partial<Llm> = await request.json();
    changes.id = params.id;

    await operations.llm.update(changes);

    return json({});
  } catch (error) {
    console.error('Error updating model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete a model
export async function DELETE({ params }) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Model ID is required'
      }, { status: 400 });
    }

    await operations.llm.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
