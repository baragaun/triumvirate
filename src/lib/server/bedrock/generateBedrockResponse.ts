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
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'

export async function generateBedrockResponse(
  chatId: string,
  chat?: Chat | null,
): Promise<{ chatMessage?: ChatMessage | null; error?: string }> {
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

    let messages = await findChatMessages(chatId, MessageRole.assistant);
    const sendingInstructions = messages.length < 1;

    if (messages.length > 0) {
      messages = messages.map((message) => {
        if (message.role === MessageRole.system) {
          return {
            ...message,
            role: MessageRole.user,
          };
        }
        return message;
      });
    }

    const llmContext = chat.llmContextId
      ? await findLlmContext(chat.llmContextId || 'default')
      : null;

    if (llmContext?.instructions) {
      messages.unshift({
        id: 'instructions',
        chatId: chat.id,
        role: 'user',
        content: llmContext.instructions,
        status: null,
        error: null,
        feedback: null,
        sendToLlm: true,
        sendToUser: false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
    }

    if (messages.length < 1) {
      console.error('generateBedrockResponse: No messages found in chat.');
      return { error: 'No messages found' };
    }

    const llmId = chat.llmId || llmContext?.llmId;
    const temperature = chat.llmTemperature || llmContext?.llmTemperature || 0.7;
    const maxTokens = chat.llmMaxTokens || llmContext?.llmMaxTokens || 1000;

    if (!llmId) {
      console.error('Error generating response from Bedrock: LLM ID is required');
      return { error: 'LLM ID is required' };
    }

    const prompt = formatPromptForModel(llmId, messages);
    const requestBody = createRequestBody(llmId, prompt, temperature, maxTokens);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId: llmId,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
      accept: 'application/json',
    });

    // Invoke the model
    const response = await client.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response body:', JSON.stringify(responseBody, null, 2));

    // Extract the generated text based on the model
    const generatedText = extractResponseText(chat.llmId, responseBody);

    // Save the assistant's response to the database:
    const chatMessage = await createChatMessage({
      chatId,
      role: 'assistant',
      content: generatedText,
      // When the context has a welcome message, we don't show the first response of the LLM
      // to the instructions to the user. That gives us better control over the first message
      // shown to the user.
      sendToUser: !sendingInstructions || !llmContext?.welcomeMessage,
    });

    return { chatMessage };
  } catch (error) {
    console.error('Error generating response from Bedrock:', error);

    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
