import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { describe, expect, test } from 'vitest'
import { parseXmlLlmInstructions } from '$lib/server/llmContextFactory/xml/parseXmlLlmInstructions'
import { compilePrompt } from '$lib/server/llmContextFactory/compilePrompt'

describe('compilePrompt', () => {
  test('compiles the prompt from the LlmContext object (template file)', async () => {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const xmlPath = path.join(dirname, '../../../../../_hs_local/llm-instructions-v0.0.15.xml');
    const xml = readFileSync(xmlPath, 'utf-8');

    const llmContext = parseXmlLlmInstructions(xml);
    llmContext.variables.push({
      name: 'username',
      type: 'string',
      value: 'Erika',
    })

    for (const stage of llmContext.stages) {
      const prompt = compilePrompt(llmContext, stage.key);
      console.log('---------------------------------------------------------------------------------------');
      console.log(`Stage ${stage.key}: ${stage.description}` + '\n', prompt);
    }
  });

  test.skip('compiles the prompt from the LlmContext object', async () => {
    const xml = `
        <context>
          <info>
            <version>1.0.0</version>
            <date>2024-01-01</date>
            <description>Sample XML</description>
          </info>
          <variable name="testString" type="string" value="test"/>
          <variable name="testNumber" type="number" value="42"/>
          <variable name="testBoolean" type="boolean" value="true"/>
          <stage
            key="A"
            description="first stage"
            blocks="block-1, block-3"
          />
          <stage
            key="B"
            description="second stage"
            blocks="block-2"
          />
          <block key="block-1"><![CDATA[first block {{testString}}]]></block>
          <block key="block-2"><![CDATA[second block]]></block>
          <block key="block-3"><![CDATA[third block+{{block-block-4}}]]></block>
          <block key="block-4"><![CDATA[forth block]]></block>
        </context>
    `;

    const llmContext = parseXmlLlmInstructions(xml);
    const textStageA = compilePrompt(llmContext, 'A');

    expect(textStageA.replaceAll('\n', '|')).toBe('first block test|third block+forth block');
  });
});
