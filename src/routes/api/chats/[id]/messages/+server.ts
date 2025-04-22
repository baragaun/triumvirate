import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';
import { type ChatMessage } from '$lib/server/db/schema'

export async function GET({ params }: RequestEvent) {
  try {
    const chatId = params.id;

    if (!chatId) {
      return json({
        error: 'Chat ID is required'
      }, { status: 400 });
    }

    const messages = await operations.chatMessage.find(chatId);

    return json({ messages });
  } catch (error) {
    console.error('Error retrieving messages:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST({ request, params }: RequestEvent) {
  try {
    const props: Partial<ChatMessage> = await request.json();

    if (!props.chatId) {
      props.chatId = params.id;
    }

    console.log('Creating chat message with props:', props);
    const response = props.id
      ? await operations.chatMessage.update(props, true)
      : await operations.chatMessage.create(props, true);

    return json(response);
  } catch (error) {
    console.error('Error processing chat request:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
