import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

export async function DELETE({ params }) {
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
