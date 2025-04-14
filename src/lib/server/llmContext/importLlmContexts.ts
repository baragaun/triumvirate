import { env } from '$env/dynamic/private';
import type { LlmContext } from '$lib/server/db/schema';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { findLlmContext } from '$lib/server/llmContext/findLlmContext'
import { createLlmContext } from '$lib/server/llmContext/createLlmContext'

export const importLlmContexts = async (): Promise<LlmContext[]> => {
  try {
    const configPath = env.CONFIG_PATH || 'config';
    const contextsPath = join(configPath, 'contexts');

    if (!existsSync(contextsPath)) {
      console.warn(`loadLlmContexts: Contexts directory not found: ${contextsPath}`);
      return [];
    }

    const contextDirs = readdirSync(contextsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (contextDirs.length < 1) {
      console.warn(`loadLlmContexts: No context directories found in ${contextsPath}`);
      return [];
    }

    console.log(`Found ${contextDirs.length} context directories:`, contextDirs);

    const llmContexts: LlmContext[] = [];

    for (const contextDir of contextDirs) {
      const contextPath = join(contextsPath, contextDir);
      const configJsonPath = join(contextPath, 'config.json');
      const instructionsPath = join(contextPath, 'instructions.md');
      const welcomePath = join(contextPath, 'welcome.txt');
      const configJson = JSON.parse(readFileSync(configJsonPath, 'utf8'));
      const description = configJson.description || '';

      if (!existsSync(configJsonPath)) {
        console.warn(`Skipping context ${contextDir}: Missing config.json`);
        continue;
      }

      let instructions = '';
      if (existsSync(instructionsPath)) {
        instructions = readFileSync(instructionsPath, 'utf8');
      }

      let welcomeMessage = null;
      if (existsSync(welcomePath)) {
        welcomeMessage = readFileSync(welcomePath, 'utf8');
      }

      const context: LlmContext = {
        id: contextDir,
        description,
        llmId: configJson.llmId || null,
        llmTemperature: configJson.llmTemperature || null,
        llmMaxTokens: configJson.llmMaxTokens || null,
        instructions,
        welcomeMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      llmContexts.push(context);
      const existingContext = await findLlmContext(context.id);
      if (!existingContext) {
        console.log(`Creating context: ${contextDir}`);
        await createLlmContext(context);
      }
    }

    return llmContexts;
  } catch (error) {
    console.error('Error in loadLlmContexts:', error);
    return [];
  }
}
