import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { describe, expect, test } from 'vitest'
import { parseXmlLlmInstructions } from '$lib/server/llmContextFactory/xml/parseXmlLlmInstructions'

describe('parseXmlLlmInstructions', () => {
  test('parseXmlLlmInstructions parses XML file correctly', async () => {
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const xmlPath = path.join(dirname, '../../../../../_hs_local/llm-instructions-v0.0.12.xml');
    const xmlContent = readFileSync(xmlPath, 'utf-8');

    const llmContext = parseXmlLlmInstructions(xmlContent);

    // Info:
    expect(llmContext.version).toEqual('0.0.12');
    expect(llmContext.description).toEqual('First to use XML');

    // Variables:
    expect(llmContext.variables.length).toEqual(4);

    expect(llmContext.variables[0].name).toEqual('enableGoals');
    expect(llmContext.variables[0].type).toEqual('boolean');
    expect(llmContext.variables[0].value).toEqual(true);

    expect(llmContext.variables[1].name).toEqual('allowOtherLanguages');
    expect(llmContext.variables[1].type).toEqual('boolean');
    expect(llmContext.variables[1].value).toEqual(false);

    expect(llmContext.variables[2].name).toEqual('sampleStringVar');
    expect(llmContext.variables[2].type).toEqual('string');
    expect(llmContext.variables[2].value).toEqual('abcd');

    expect(llmContext.variables[3].name).toEqual('sampleNumberVar');
    expect(llmContext.variables[3].type).toEqual('number');
    expect(llmContext.variables[3].value).toEqual(1234);

    // Stages:
    expect(llmContext.stages.length).toEqual(7);

    expect(llmContext.stages[0].key).toEqual('A');
    expect(llmContext.stages[0].description).toEqual('Collect information: Get all 6 key information, and save them to the metadata');
    expect(llmContext.stages[0].blocks).toEqual(['intro', 'info-to-gather']);

    // Blocks:
    expect(llmContext.blocks.length).toEqual(4);
  });

  test('parseXmlLlmInstructions parses XML string correctly', async () => {
    const xmlString = `
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

    const llmContext = parseXmlLlmInstructions(xmlString);

    // Info:
    expect(llmContext.version).toEqual('1.0.0');
    expect(llmContext.description).toEqual('Sample XML');

    // Variables:
    expect(llmContext.variables.length).toEqual(3);

    expect(llmContext.variables[0].name).toEqual('testString');
    expect(llmContext.variables[0].type).toEqual('string');
    expect(llmContext.variables[0].value).toEqual('test');

    expect(llmContext.variables[1].name).toEqual('testNumber');
    expect(llmContext.variables[1].type).toEqual('number');
    expect(llmContext.variables[1].value).toEqual(42);

    expect(llmContext.variables[2].name).toEqual('testBoolean');
    expect(llmContext.variables[2].type).toEqual('boolean');
    expect(llmContext.variables[2].value).toEqual(true);

    // Stages:
    expect(llmContext.stages.length).toEqual(2);

    expect(llmContext.stages[0].key).toEqual('A');
    expect(llmContext.stages[0].description).toEqual('first stage');
    expect(llmContext.stages[0].blocks).toEqual(['block-1']);

    expect(llmContext.stages[1].key).toEqual('B');
    expect(llmContext.stages[1].description).toEqual('second stage');
    expect(llmContext.stages[1].blocks).toEqual(['block-2']);

    // Blocks:
    expect(llmContext.blocks.length).toEqual(2);
    expect(llmContext.blocks[0].key).toEqual('block-1');
    expect(llmContext.blocks[0].content).toEqual('first block');

    expect(llmContext.blocks[1].key).toEqual('block-2');
    expect(llmContext.blocks[1].content).toEqual('second block');
  });
});
