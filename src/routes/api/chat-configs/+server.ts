import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { ChatConfig } from '$lib/server/db/schema'

// Get all chat configs
export async function GET() {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    const chatConfigs = await operations.chatConfig.find();
    const selectedChatConfigId = chatConfigs[0]?.id || 'default';

    return json({ chatConfigs, selectedChatConfigId });
  } catch (error) {
    console.error('Error retrieving chat configs:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new chat config
export async function POST({ request }) {
  try {
    const props: ChatConfig = await request.json();

    // Validate required fields
    if (!props.id || !props.llmInstructions) {
      return json({
        error: 'Missing required fields: id and instructions are required'
      }, { status: 400 });
    }

    const chatConfig = await operations.chatConfig.create(props);

    return json({ chatConfig });
  } catch (error) {
    console.error('Error creating chat config:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
