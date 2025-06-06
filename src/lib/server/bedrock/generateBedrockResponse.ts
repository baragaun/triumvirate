import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import type { Chat, ChatMessage, User } from '$lib/server/db/schema'
import { formatPromptForModel } from '$lib/server/bedrock/helpers/formatPromptForModel'
import bedrockClient from '$lib/server/bedrock/bedrockClient'
import { createRequestBody } from '$lib/server/bedrock/helpers/createRequestBody'
import { extractResponseText } from '$lib/server/bedrock/helpers/extractResponseText'
import { parseAiMessage } from '$lib/server/bedrock/helpers/parseAiMessage'
import { findChatMessages } from '$lib/server/chatMessage/findChatMessages'
import { findChat } from '$lib/server/chat/findChat'
import { createChatMessage } from '$lib/server/chatMessage/createChatMessage'
import { MessageRole } from '$lib/enums'
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import type { ChatMetadata, GenerateChatMessageResponse } from '$lib/types'
import { updateChatMessage } from '$lib/server/chatMessage/updateChatMessage'
import { env } from '$env/dynamic/private';
import { findLlm } from '$lib/server/llm/findLlm'
import { llmContextFactory } from '$lib/server/llmContextFactory/llmContextFactory'
import { findUser } from '$lib/server/user/findUser'

const MOCK = env.MOCK_AI_RESPONSES === 'true';

export async function generateBedrockResponse(
  chatId: string,
  user?: User | null,
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

    if (!user && chat.userId) {
      user = await findUser(chat.userId);

      if (!user) {
        return { error: 'user not found' };
      }
    }

    let messages = await findChatMessages(chatId);
    let iteration: number | null = null;

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
          if (message.role === MessageRole.platform) {
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

    let llmContext;
    try {
      llmContext = await llmContextFactory.getLlmContext(
        chatId,
        [],
        user,
        chat,
        chatConfig,
      );
    } catch (error) {
      console.error('Error getting LLM context:', error);
      return { error: 'Failed to retrieve LLM context' };
    }
    if (!llmContext || !llmContext.prompt) {
      console.error('Error generating response from Bedrock: LLM instructions not found');
      return { error: 'LLM instructions not found' };
    }
    console.log('LLM context:', llmContext.prompt);

    const llmId = chat.llmId || chatConfig?.llmId;
    const llmTemperature = chat.llmTemperature || chatConfig?.llmTemperature || 0.7;
    const llmMaxTokens = chat.llmMaxTokens || chatConfig?.llmMaxTokens || 1000;

    if (!llmId) {
      console.error('Error generating response from Bedrock: LLM ID is required');
      return { error: 'LLM ID is required' };
    }

    const llm = await findLlm(llmId);
    const stage = chat.stage || llmContext?.stages?.[0]?.key;

    if (llmContext.prompt) {
      if (chat.welcomeMessage || chatConfig?.welcomeMessage) {
        messages.unshift({
          id: 'welcome',
          chatId: chat.id,
          role: MessageRole.assistant,
          stage: '',
          content: chat.welcomeMessage || chatConfig?.welcomeMessage || '',
          iteration: null,
          sendToLlm: true,
          sendToUser: false,
          replaced: false,
          sendStatus: null,
          error: null,
          llmId: null,
          llmTemperature: null,
          llmInstructions: null,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          metadata: null,
          feedback: null,
          rating: null,
          responseTime: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      messages.unshift({
        id: 'instructions',
        chatId: chat.id,
        role: MessageRole.user,
        stage: '',
        content: llmContext.prompt,
        iteration: null,
        sendToLlm: true,
        sendToUser: false,
        replaced: false,
        sendStatus: null,
        error: null,
        llmId: null,
        llmTemperature: null,
        llmInstructions: null,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        metadata: null,
        feedback: null,
        rating: null,
        responseTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (messages.length < 1) {
      console.error('generateBedrockResponse: No messages found in chat.');
      return { error: 'No messages found' };
    }

    const prompt = formatPromptForModel(chat, messages, llmId);
    const requestBody = createRequestBody(llmId, prompt, llmTemperature, llmMaxTokens);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const command = new InvokeModelCommand({
      modelId: llmId,
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
      accept: 'application/json',
    });

    let generatedText: string;
    let inputTokens = 0;
    let outputTokens = 0;
    let cost = 0;
    let responseTime = 0;
    let metadata: ChatMetadata | undefined = undefined;

    if (MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      generatedText = `This is a mock generated from the assistant #${iteration || '1'}.`;
    } else {
      const start = Date.now();
      const response = await client.send(command);
      responseTime = Date.now() - start;

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('Response body:', JSON.stringify(responseBody, null, 2));

      // Extract the generated text based on the model
      generatedText = extractResponseText(chat.llmId, responseBody);

      if (generatedText.includes('<metadata>')) {
        const parsedMessage = parseAiMessage(generatedText);
        console.log('generateBedrockResponse: metadata found.', parsedMessage);
        generatedText = parsedMessage.content;
        if (parsedMessage.metadata) {
          metadata = parsedMessage.metadata;
        }
      }

      inputTokens = responseBody.usage.input_tokens;
      outputTokens = responseBody.usage.output_tokens;

      if (llm?.inputTokenCost !== undefined || llm?.tokenCost !== undefined) {
        cost = inputTokens * (llm.inputTokenCost ?? llm.tokenCost);
      }
      if (llm?.outputTokenCost !== undefined || llm?.tokenCost !== undefined) {
        cost += outputTokens * (llm.outputTokenCost ?? llm.tokenCost);
      }
    }

    // Save the assistant's response to the database:
    const props: Partial<ChatMessage> = {
      chatId,
      role: 'assistant',
      stage,
      content: generatedText,
      iteration,
      sendToUser: true,
      sendToLlm: true,
      llmId,
      llmInstructions: llmContext.prompt,
      llmTemperature,
      metadata,
      inputTokens,
      outputTokens,
      cost,
      responseTime,
    };
    const createChatMessageResponse = await createChatMessage(props, false);

    if (!createChatMessageResponse.chatMessages || createChatMessageResponse.chatMessages.length !== 1) {
      console.error('Error generating response from Bedrock: Failed to create chat message');
      return { error: 'Failed to create chat message' };
    }

    return {
      chatMessage: createChatMessageResponse.chatMessages[0],
    };
  } catch (error) {
    console.error('Error generating response from Bedrock:', error);

    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
