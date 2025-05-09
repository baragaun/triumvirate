import { env } from '$env/dynamic/private';
import type { ChatConfig } from '$lib/server/db/schema';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { findChatConfig } from '$lib/server/chatConfig/findChatConfig'
import { createChatConfig } from '$lib/server/chatConfig/createChatConfig'

export const importChatConfigs = async (): Promise<ChatConfig[]> => {
  try {
    const configsPath = env.CONFIG_PATH || 'config';

    if (!existsSync(configsPath)) {
      console.warn(`loadChatConfigs: Configs directory not found: ${configsPath}`);
      return [];
    }

    const configDirs = readdirSync(configsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (configDirs.length < 1) {
      console.warn(`loadChatConfigs: No config directories found in ${configsPath}`);
      return [];
    }

    console.log(`Found ${configDirs.length} config directories:`, configDirs);

    const chatConfigs: ChatConfig[] = [];

    for (const configDir of configDirs) {
      const configPath = join(configsPath, configDir);
      const configJsonPath = join(configPath, 'config.json');
      const instructionsPath = join(configPath, 'instructions.md');
      const welcomePath = join(configPath, 'welcome.txt');
      const configJson = JSON.parse(readFileSync(configJsonPath, 'utf8'));
      const description = configJson.description || '';

      if (!existsSync(configJsonPath)) {
        console.warn(`Skipping config ${configDir}: Missing config.json`);
        continue;
      }

      let llmInstructions = '';
      if (existsSync(instructionsPath)) {
        llmInstructions = readFileSync(instructionsPath, 'utf8');
      }

      let welcomeMessage = null;
      if (existsSync(welcomePath)) {
        welcomeMessage = readFileSync(welcomePath, 'utf8');
      }

      const config: ChatConfig = {
        id: configDir,
        isDefault: configJson.isDefault ?? configDir === 'default',
        description,
        caption: configJson.caption || null,
        introduction: configJson.introduction || null,
        feedbackButtonLabel0: configJson.feedbackButtonLabel0 || 'Helpful',
        feedbackButtonLabel1: configJson.feedbackButtonLabel1 || 'Not Helpful',
        feedbackButtonLabel2: configJson.feedbackButtonLabel2 || 'Wrong',
        feedbackButtonLabel3: configJson.feedbackButtonLabel3 || null,
        feedbackButtonLabel4: configJson.feedbackButtonLabel4 || null,
        feedbackButtonValue0: configJson.feedbackButtonValue0 || 'helpful',
        feedbackButtonValue1: configJson.feedbackButtonValue1 || 'not-helpful',
        feedbackButtonValue2: configJson.feedbackButtonValue2 || 'wrong',
        feedbackButtonValue3: configJson.feedbackButtonValue3 || null,
        feedbackButtonValue4: configJson.feedbackButtonValue4 || null,
        feedbackButtonLlmText0: configJson.feedbackButtonLlmText0 || 'The user found your response helpful.',
        feedbackButtonLlmText1: configJson.feedbackButtonLlmText1 || 'The user did not find your response helpful.',
        feedbackButtonLlmText2: configJson.feedbackButtonLlmText2 || 'The user thought your response is wrong.',
        feedbackButtonLlmText3: configJson.feedbackButtonLlmText3 || null,
        feedbackButtonLlmText4: configJson.feedbackButtonLlmText4 || null,
        feedbackQuestion0: configJson.feedbackQuestion0 || null,
        feedbackQuestion1: configJson.feedbackQuestion1 || null,
        feedbackQuestion2: configJson.feedbackQuestion2 || null,
        feedbackQuestion3: configJson.feedbackQuestion3 || null,
        feedbackQuestion4: configJson.feedbackQuestion4 || null,
        feedbackQuestion5: configJson.feedbackQuestion5 || null,
        feedbackQuestion6: configJson.feedbackQuestion6 || null,
        feedbackQuestion7: configJson.feedbackQuestion7 || null,
        feedbackQuestion8: configJson.feedbackQuestion8 || null,
        feedbackQuestion9: configJson.feedbackQuestion9 || null,
        llmId: configJson.llmId || null,
        llmTemperature: configJson.llmTemperature || null,
        llmMaxTokens: configJson.llmMaxTokens || null,
        llmInstructions,
        welcomeMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      chatConfigs.push(config);
      const existingConfig = await findChatConfig(config.id);
      if (!existingConfig) {
        console.log(`Creating config: ${configDir}`);
        await createChatConfig(config);
      }
    }

    return chatConfigs;
  } catch (error) {
    console.error('Error in loadChatConfigs:', error);
    return [];
  }
}
