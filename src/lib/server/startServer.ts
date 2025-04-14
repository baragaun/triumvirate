import { initDb } from '$lib/server/db/initDb'
import dataStore from '$lib/server/dataStore'
import { importBedrockModels } from '$lib/server/bedrock/importBedrockModels'
import { findLlms } from '$lib/server/llm/findLlms'
import { importChatConfigs } from '$lib/server/chatConfig/importChatConfigs'

export const startServer = async (): Promise<void> => {
  if (dataStore.isStarted()) {
    return;
  }

  console.log('Starting server...');

  await initDb();

  const llms = await findLlms();
  if (!Array.isArray(llms) || llms.length < 1) {
    await importBedrockModels();
  }

  await importChatConfigs();

  dataStore.setStarted();
};
