import type { Llm } from '$lib/server/db/schema'
import {
  ListFoundationModelsCommand,
  type ListFoundationModelsCommandOutput
} from '@aws-sdk/client-bedrock'
import { saveMultipleLlms } from '$lib/server/llm/saveMultipleLlms'
import bedrockClient from '$lib/server/bedrock/bedrockClient'
import { upsertLlm } from '$lib/server/llm/upsertLlm'

// {
//     "customizationsSupported": [],
//     "explicitPromptCaching": {
//         "isSupported": false
//     },
//     "guardrailsSupported": true,
//     "inferenceTypesSupported": [
//         "ON_DEMAND"
//     ],
//     "inputModalities": [
//         "TEXT"
//     ],
//     "intelligentPromptRouting": {
//         "isSupported": false
//     },
//     "modelArn": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-tg1-large",
//     "modelId": "amazon.titan-tg1-large",
//     "modelLifecycle": {
//         "status": "ACTIVE"
//     },
//     "modelName": "Titan Text Large",
//     "outputModalities": [
//         "TEXT"
//     ],
//     "providerName": "Amazon",
//     "responseStreamingSupported": true
// },

const enabledModels = [
  'ai21.jamba-1-5-large-v1:0',
  'ai21.jamba-1-5-mini-v1:0',
  'amazon.titan-embed-g1-text-02',
  'amazon.titan-embed-image-v1',
  'amazon.titan-embed-text-v1',
  'amazon.titan-embed-text-v2:0',
  'amazon.titan-image-generator-v1',
  'amazon.titan-image-generator-v2:0',
  'amazon.titan-text-express-v1',
  'amazon.titan-text-lite-v1',
  'amazon.titan-text-premier-v1:0',
  'amazon.titan-tg1-large',
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'anthropic.claude-3-haiku-20240307-v1:0',
  // 'cohere.command-light-text-v14',
  // 'cohere.command-r-plus-v1:0',
  // 'cohere.command-r-v1:0',
  // 'cohere.command-text-v14',
  // 'cohere.embed-english-v3',
  // 'cohere.embed-multilingual-v3',
  // 'meta.llama3-70b-instruct-v1:0',
  // 'meta.llama3-8b-instruct-v1:0',
  'mistral.mistral-7b-instruct-v0:2',
  'mistral.mistral-large-2402-v1:0',
  'mistral.mistral-small-2402-v1:0',
  'mistral.mixtral-8x7b-instruct-v0:1',
];

/**
 * Loads all models from Bedrock and saves them to the database.
 *
 * Micromentor AWS credits:
 * Credits can be applied to Sagemaker and all of the services you listed below EXCEPT:
 * • Not available for Nova
 * • The Llama services that are available are Llama 2 13B Chat and Llama 2 70B Chat
 */
export const importBedrockModels = async () => {
  try {
    const client = bedrockClient.getClient();

    // List available foundation models
    const command = new ListFoundationModelsCommand({});
    const response: ListFoundationModelsCommandOutput = await client.send(command);

    const llms: Llm[] = (response.modelSummaries || []).map(model => ({
      id: model.modelId || '',
      provider: model.providerName || '',
      name: model.modelName || '',
      description: JSON.stringify(model),
      tokenCost: 0,
      isOnDemand: model.inferenceTypesSupported?.includes('ON_DEMAND') || false,
      isActive: model.modelLifecycle?.status === 'ACTIVE' || false,
      isAvailable: !!model.modelId && enabledModels.includes(model.modelId),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    for (const llm of llms) {
      await upsertLlm(llm);
    }

    return llms;
  } catch (error) {
    console.error('Error listing Bedrock llms:', error);

    // Return an error response
    return [];
  }
}
