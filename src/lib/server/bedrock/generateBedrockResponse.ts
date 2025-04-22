import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import type { Chat, ChatMessage } from '$lib/server/db/schema'
import { formatPromptForModel } from '$lib/server/bedrock/helpers/formatPromptForModel'
import bedrockClient from '$lib/server/bedrock/bedrockClient'
import { createRequestBody } from '$lib/server/bedrock/helpers/createRequestBody'
import { extractResponseText } from '$lib/server/bedrock/helpers/extractResponseText'
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'
import { findChat } from '$lib/server/chat/findChat'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage'
import { MessageRole } from '$lib/enums'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import type { GenerateChatMessageResponse } from '$lib/types'
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage'
import { env } from '$env/dynamic/private';

const MOCK = env.MOCK_AI_RESPONSES === 'true';

export async function generateBedrockResponse(
  chatId: string,
  chat?: Chat | null,
): Promise<GenerateChatMessageResponse> {
  console.log('generateBedrockResponse called.', { chatId });

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  try {
    const client = bedrockClient.getRuntimeClient();

    if (!client) {
      return { error: 'Service not available' };
    }

    if (!chat) {
      chat = await findChat(chatId);

      if (!chat) {
        return { error: 'chat not found' };
      }
    }

    let messages = await findChatMessages(chatId);
    const sendingInstructions = messages.length < 1;
    let iteration: number | null = null;
    let llmInstructions = chat.llmInstructions;

    if (messages.length > 0) {
      const previousMessage = messages[messages.length - 1];
      if (previousMessage.role === MessageRole.assistant) {
        // The user requested to re-generate the last message, likely with modified settings,
        // such as model ID, temperature, or instructions.
        // The last message will always have `sendToLlm: true`, so we will have to update it,
        // even if it already had an iteration.
        const changesToPreviousMessage: Partial<ChatMessage> = {
          id: previousMessage.id,
          sendToLlm: false,
          replaced: true,
        }
        previousMessage.sendToLlm = false;

        if (previousMessage.iteration === null) {
          changesToPreviousMessage.iteration = 1;
          iteration = 2;
        } else {
          iteration = previousMessage.iteration + 1;
        }

        await updateChatMessage(changesToPreviousMessage, false);
      }

      messages = messages
        .filter((message) => message.sendToLlm)
        .map((message) => {
          if (message.role === MessageRole.system) {
            return {
              ...message,
              role: MessageRole.user,
            };
          }
          return message;
        });
    }

    const chatConfig = chat.configId
      ? await findChatConfig(chat.configId || 'default')
      : null;

    if (!llmInstructions && chatConfig?.llmInstructions) {
      llmInstructions = chatConfig.llmInstructions;
    }

    const llmId = chat.llmId || chatConfig?.llmId;
    const llmTemperature = chat.llmTemperature || chatConfig?.llmTemperature || 0.7;
    const llmMaxTokens = chat.llmMaxTokens || chatConfig?.llmMaxTokens || 1000;
    // When the config has a welcome message, we don't show the first response of the LLM
    // to the instructions to the user. That gives us better control over the first message
    // shown to the user.
    const sendToUser = !sendingInstructions || !chatConfig?.welcomeMessage;

    if (!llmId) {
      console.error('Error generating response from Bedrock: LLM ID is required');
      return { error: 'LLM ID is required' };
    }

    if (llmInstructions) {
      messages.unshift({
        id: 'instructions',
        chatId: chat.id,
        role: MessageRole.user,
        content: llmInstructions,
        iteration: null,
        feedback: null,
        sendToLlm: true,
        sendToUser: false,
        replaced: false,
        sendStatus: null,
        error: null,
        llmId,
        llmTemperature,
        llmInstructions: null,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    }

    if (messages.length < 1) {
      console.error('generateBedrockResponse: No messages found in chat.');
      return { error: 'No messages found' };
    }

    const prompt = formatPromptForModel(llmId, messages);
    const requestBody = createRequestBody(llmId, prompt, llmTemperature, llmMaxTokens);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId: llmId,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
      accept: 'application/json',
    });

    let generatedText: string;
    if (MOCK) {
      generatedText = sendingInstructions
        ? 'This is a mock response to the instructions.'
        : `This is a mock generated from the assistant #${iteration || '1'}.`;
    } else {
      // Invoke the model
      const response = await client.send(command);

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('Response body:', JSON.stringify(responseBody, null, 2));

      // Extract the generated text based on the model
      generatedText = extractResponseText(chat.llmId, responseBody);
    }

    // Save the assistant's response to the database:
    const props: Partial<ChatMessage> = {
      chatId,
      role: 'assistant',
      content: generatedText,
      iteration,
      sendToUser,
      llmId,
      llmTemperature,
    };
    const createChatMessageResponse = await createChatMessage(props, false);

    if (!createChatMessageResponse.chatMessages || createChatMessageResponse.chatMessages.length !== 1) {
      console.error('Error generating response from Bedrock: Failed to create chat message');
      return { error: 'Failed to create chat message' };
    }

    return { chatMessage: createChatMessageResponse.chatMessages[0] };
  } catch (error) {
    console.error('Error generating response from Bedrock:', error);

    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
