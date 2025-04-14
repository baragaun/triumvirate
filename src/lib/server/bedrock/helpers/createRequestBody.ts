export function createRequestBody(
  llmId: string,
  prompt: any,
  temperature: number,
  maxTokens: number
): any {
  // Claude models:
  if (llmId.includes('anthropic.claude')) {
    return {
      anthropic_version: 'bedrock-2023-05-31',
      messages: prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };
  }

  // Titan models:
  if (llmId.includes('amazon.titan')) {
    return {
      inputText: prompt.inputText,
      textGenerationConfig: {
        maxTokenCount: maxTokens,
        temperature: temperature,
        topP: 0.9
      }
    };
  }

  // Nova models (both Pro and Lite):
  if (llmId.includes('amazon.nova')) {
    return {
      inferenceConfig: {
        max_new_tokens: maxTokens,
        temperature: temperature
      },
      messages: prompt
    };
  }

  // Llama Models:
  if (llmId.includes('meta.llama')) {
    return {
      prompt: prompt,
      max_gen_len: maxTokens,
      temperature: temperature
    };
  }

  return {
    prompt: prompt,
    max_tokens: maxTokens,
    temperature: temperature
  };
}
