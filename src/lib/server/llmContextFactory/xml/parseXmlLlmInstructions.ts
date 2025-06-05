import { XMLParser } from 'fast-xml-parser';
import type { LlmContext, LlmContextBlock, LlmContextChatStage, LlmContextVariable } from '$lib/types'

interface XmlVariable {
  name: string;
  type: string;
  value: string;
}

interface XmlStage {
  key: string;
  description: string;
  blocks: string;
  enabled: string | null | undefined;
}

interface XmlBlock {
  key: string;
  _: string;
}

interface XmlInfo {
  version: string;
  date: string;
  description: string;
}

interface XmlContext {
  info: XmlInfo;
  variable: XmlVariable | XmlVariable[];
  stage: XmlStage | XmlStage[]
  block: XmlBlock | XmlBlock[]
}

interface XmlRoot {
  context: XmlContext;
}

const parseBoolean = (value: string | null | undefined, defaultValue: boolean): boolean => {
  if (!value) {
    return defaultValue;
  }

  if (['true', 'yes', '1'].includes(value.trim())) {
    return true;
  } else if (['false', 'no', '0'].includes(value.trim())) {
    return false;
  }

  return defaultValue;
}

export function parseXmlLlmInstructions(xmlContent: string): LlmContext {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_',
  });

  const parsed: XmlRoot = parser.parse(xmlContent);

  const xmlInfo: XmlInfo = parsed.context.info;
  const xmlVariables: XmlVariable | XmlVariable[] = parsed.context.variable;
  const xmlStages: XmlStage | XmlStage[] = parsed.context.stage;
  const xmlBlocks: XmlBlock | XmlBlock[] = parsed.context.block;


  let variables: LlmContextVariable[] = [];
  if (Array.isArray(xmlVariables)) {
    variables = xmlVariables.map((variable) => {
      let value: string | number | boolean = variable.value;
      if (variable.type === 'number') {
        value = Number(value);
      } else if (variable.type === 'boolean') {
        value = value === 'true';
      }
      return {
        name: variable.name,
        type: variable.type,
        value: value,
      };
    })
  } else if (xmlVariables) {
    let value: string | number | boolean = xmlVariables.value;
    if (xmlVariables.type === 'number') {
      value = Number(value);
    } else if (xmlVariables.type === 'boolean') {
      value = value === 'true';
    }
    variables = [{
      name: xmlVariables.name,
      type: xmlVariables.type,
      value: value,
    }];
  }

  let blocks: LlmContextBlock[] = [];
  if (Array.isArray(xmlBlocks)) {
    blocks = xmlBlocks.map(block => ({
      key: block.key,
      content: block._,
    }));
  } else if (xmlBlocks) {
    blocks = [{
      key: xmlBlocks.key,
      content: xmlBlocks._,
    }];
  }

  let stages: LlmContextChatStage[] = [];
  if (Array.isArray(xmlStages)) {
    stages = xmlStages.map(stage => ({
      key: stage.key,
      description: stage.description,
      blocks: stage.blocks.split(',').map(block => block.trim()),
      enabled: parseBoolean(stage.enabled, true),
    }));
  } else if (xmlStages) {
    stages = [{
      key: xmlStages.key,
      description: xmlStages.description,
      blocks: xmlStages.blocks.split(',').map(block => block.trim()),
      enabled: parseBoolean(xmlStages.enabled, true),
    }];
  }

  return {
    version: xmlInfo.version,
    date: xmlInfo.date,
    description: xmlInfo.description,
    variables,
    stages,
    blocks,
    prompt: '',
  };
}
