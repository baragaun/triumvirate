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
        caption: configJson.caption || null,
        description,
        isDefault: configJson.isDefault ?? configDir === 'default',
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
