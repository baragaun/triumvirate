import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';
import type { Chat } from '$lib/server/db/schema';
import { decryptString } from '$lib/helpers/decryptString'

export async function GET({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const chatInfo = await operations.chat.findInfo(id);

    if (!chatInfo) {
      return json({ error: 'Chat not found' }, { status: 404 });
    }

    return json(chatInfo);
  } catch (error) {
    console.error('Error retrieving model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT({ params, request }: RequestEvent) {
  try {
    if (!params.id) {
      return json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const changes: Partial<Chat> = await request.json();
    changes.id = params.id;

    if (changes.llmInstructions) {
      // The app is sending this encrypted, to prevent security alarms.
      changes.llmInstructions = decryptString(changes.llmInstructions);
    }

    const response = await operations.chat.update(changes);

    if (response.error) {
      return json({ error: response.error }, { status: 500 });
    }

    const chat = await operations.chat.findOne(changes.id);

    return json({ chat });
  } catch (error) {
    console.error('Error updating CHAT config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete a chat
export async function DELETE({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Chat ID is required'
      }, { status: 400 });
    }

    await operations.chat.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting model:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
