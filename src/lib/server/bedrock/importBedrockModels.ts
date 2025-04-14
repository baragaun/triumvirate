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
      isOnDemand: model.inferenceTypesSupported?.includes('ON_DEMAND') || false,
      isActive: model.modelLifecycle?.status === 'ACTIVE' || false,
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
