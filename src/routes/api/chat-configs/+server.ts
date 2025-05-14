import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';
import type { ChatConfig } from '$lib/server/db/schema'
import { decryptString } from '$lib/helpers/decryptString'

// Get all chat configs
export async function GET() {
  try {
    if (!operations.isStarted()) {
      await operations.startServer();
    }

    const chatConfigs = await operations.chatConfig.find();
    const defaultConfig = chatConfigs.find(config => config.isDefault);
    const selectedChatConfigId = defaultConfig?.id || chatConfigs[0]?.id;

    return json({ chatConfigs, selectedChatConfigId });
  } catch (error) {
    console.error('Error retrieving chat configs:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new chat config
export async function POST({ request }: RequestEvent) {
  try {
    const props: ChatConfig = await request.json();

    // Validate required fields
    if (!props.name || !props.llmInstructions) {
      return json({
        error: 'Missing required fields: id and instructions are required'
      }, { status: 400 });
    }

    if (props.llmInstructions) {
      // The app is sending this encrypted, to prevent security alarms.
      props.llmInstructions = decryptString(props.llmInstructions);
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
