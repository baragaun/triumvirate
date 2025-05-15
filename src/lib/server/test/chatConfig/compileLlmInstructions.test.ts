import { parseXmlLlmInstructions } from '$lib/server/chatConfig/parseXmlLlmInstructions';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { describe, expect, test } from 'vitest'
import { compileLlmInstructions } from '$lib/server/chatConfig/compileLlmInstructions'

describe('compileLlmInstructions', () => {
  test('compileLlmInstructions compiles the context text from the LlmContext object', async () => {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const xmlPath = path.join(dirname, '../../../../../_hs_local/llm-instructions-v0.0.12.xml');
    const xml = readFileSync(xmlPath, 'utf-8');

    const llmContext = parseXmlLlmInstructions(xml);
    const textStageA = compileLlmInstructions(llmContext, 'A');
    const textStageB = compileLlmInstructions(llmContext, 'B');

    expect(textStageA.replaceAll('\n', '').startsWith('## Core Purpose')).toBeTruthy();
    expect(textStageB.replaceAll('\n', '').startsWith('## Core Purpose')).toBeTruthy();
  });

  test('compileLlmInstructions compiles the context text from the LlmContext object', async () => {
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
            blocks="block-1"
          />
          <stage
            key="B"
            description="second stage"
            blocks="block-2"
          />
          <block key="block-1"><![CDATA[first block]]></block>
          <block key="block-2"><![CDATA[second block]]></block>
        </context>
    `;

    const llmContext = parseXmlLlmInstructions(xml);
    const textStageA = compileLlmInstructions(llmContext, 'A');

    expect(textStageA.replaceAll('\n', '')).toBe('first block');
  });
});
