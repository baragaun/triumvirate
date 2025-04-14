export function extractResponseText(llmId: string, responseBody: any): string {
  if (llmId.includes('anthropic.claude')) {
    // Claude llms
    return responseBody.content?.[0]?.text || '';
  } else if (llmId.includes('amazon.titan')) {
    // Titan llms
    return responseBody.results?.[0]?.outputText || '';
  } else if (llmId.includes('amazon.nova')) {
    // Nova llms (both Pro and Lite)
    if (responseBody.output?.message) {
      // Nova Lite format
      const content = responseBody.output.message.content || [];
      return content.map((item: any) => item.text || '').join('\n');
    } else if (responseBody.messages) {
      // Nova Pro format
      const content = responseBody.messages?.[0]?.content || [];
      return content.map((item: any) => item.text || '').join('\n');
    }
    // Fallback: return empty string and log the response for debugging
    console.error('Unexpected Nova model response format:', JSON.stringify(responseBody, null, 2));
    return '';
  } else if (llmId.includes('meta.llama')) {
    // Llama llms
    return responseBody.generation || '';
  } else {
    // Default extraction
    return responseBody.generated_text || responseBody.completion || '';
  }
}
