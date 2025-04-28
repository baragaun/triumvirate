import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';
import type { ChatMessage } from '$lib/server/db/schema'
import { decryptString } from '$lib/helpers/decryptString'

export async function PUT({ params, request }: RequestEvent) {
  try {
    if (!params.id) {
      return json({ error: 'Chat message ID is required' }, { status: 400 });
    }

    const changes: Partial<ChatMessage> = await request.json();
    changes.id = params.id;

    if (changes.llmInstructions) {
      // The app is sending this encrypted, to prevent security alarms.
      changes.llmInstructions = decryptString(changes.llmInstructions);
    }

    const response = await operations.chatMessage.update(changes, false);

    if (response.error) {
      return json({ error: response.error }, { status: 500 });
    }

    const chatMessage = await operations.chatMessage.findOne(changes.id);

    return json({ chatMessage });
  } catch (error) {
    console.error('Error updating chat message:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'Chat message ID is required'
      }, { status: 400 });
    }

    await operations.chatMessage.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting chat config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
