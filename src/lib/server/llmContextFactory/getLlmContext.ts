import type { Chat, ChatConfig, User } from '$lib/server/db/schema'
import type { LlmContext, LlmContextVariable } from '$lib/types'
import { parseXmlLlmInstructions } from '$lib/server/llmContextFactory/xml/parseXmlLlmInstructions'
import { compilePrompt } from '$lib/server/llmContextFactory/compilePrompt'
import { findChat } from '$lib/server/chat/findChat'
import { loadTemplate } from '$lib/server/llmContextFactory/loadTemplate'
import { getVariables } from '$lib/server/llmContextFactory/getVariables'

export async function getLlmContext(
  chatId: string,
  variables: LlmContextVariable[],
  user?: User | null,
  chat?: Chat | null,
  chatConfig?: ChatConfig | null,
): Promise<LlmContext | null> {
  if (!chat) {
    chat = await findChat(chatId);

    if (!chat) {
      console.error('loadTemplate: Error getting LLM context: Chat not found', { chatId });
      return null;
    }
  }

  const template = await loadTemplate(chatId, chat, chatConfig);
  if (!template) {
    console.error('getLlmContextObjectForChat: Error getting LLM context: LLM instructions not found',
      { chatId });
    return null;
  }

  if (!template.startsWith('<context>')) {
    return {
      version: '',
      description: '',
      date: '',
      stages: [],
      variables: [],
      blocks: [],
      prompt: template,
    };
  }

  const context = parseXmlLlmInstructions(template)
  context.variables = await getVariables(chatId, variables, user, chat, chatConfig);

  context.prompt = compilePrompt(
    context,
    chat.stage,
  )

  return context;
}
