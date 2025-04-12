import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import { type ChatMessage } from '$lib/server/db/schema'
import { MessageRole } from '$lib/enums'

export async function GET({ params }) {
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

export async function POST({ request, params }) {
  try {
    const props: Partial<ChatMessage> = await request.json();

    if (!props.chatId) {
      props.chatId = params.id;
    }

    console.log('Creating chat message with props:', props);
    const chatMessage = await operations.chatMessage.create(props);

    if (!chatMessage) {
      return json({ error: 'Failed to create chat message' }, { status: 500 });
    }

    const messages = [chatMessage];

    if (chatMessage?.role === MessageRole.user) {
      const response = await operations.bedrock.generateResponse(props.chatId);
      if (response.chatMessage) {
        messages.push(response.chatMessage);
      }
    }

    return json({ messages });
  } catch (error) {
    console.error('Error processing chat request:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
