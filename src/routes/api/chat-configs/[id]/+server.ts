import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';
import type { ChatConfig } from '$lib/server/db/schema';

// Get a specific CHAT config
export async function GET({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Chat config ID is required'
      }, { status: 400 });
    }

    const chatConfig = await operations.chatConfig.findOne(id);

    if (!chatConfig) {
      return json({
        error: 'CHAT config not found'
      }, { status: 404 });
    }

    return json({ chatConfig });
  } catch (error) {
    console.error('Error retrieving chat config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update an chat config
export async function PUT({ params, request }: RequestEvent) {
  try {
    if (!params.id) {
      return json({
        error: 'Chat config ID is required'
      }, { status: 400 });
    }

    const changes: Partial<ChatConfig> = await request.json();
    changes.id = params.id;
    await operations.chatConfig.update(changes);

    return json({});
  } catch (error) {
    console.error('Error updating chat config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete an chat config
export async function DELETE({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Chat config ID is required'
      }, { status: 400 });
    }

    await operations.chatConfig.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting chat config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
