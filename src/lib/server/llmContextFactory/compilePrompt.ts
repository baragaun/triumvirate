import Handlebars from 'handlebars';

import type { LlmContext, LlmContextVariable } from '$lib/types'

const getVariableValue = (variable: LlmContextVariable): string => {
  if (!variable.value) {
    return '';
  }

  if (variable.type === 'string') {
    return variable.value as string;
  }

  if (variable.type === 'boolean') {
    return variable.value ? 'true' : 'false';
  }

  if (variable.type === 'number') {
    return variable.value.toString();
  }

  return '';
}

export function compilePrompt(
  context: LlmContext,
  stageKey: string | null | undefined,
): string {
  if (!stageKey) {
    stageKey = context.stages[0]?.key;
  }

  if (!stageKey) {
    throw new Error('No stage key provided and no stages found in context');
  }

  const stage = context.stages.find((s) => s.key === stageKey);
  if (!stage) {
    throw new Error('No stage key provided and no stages found in context');
  }

  let text = stage.blocks
    .map((blockKey) => {
      const block = context.blocks.find((b) => b.key === blockKey);
      if (block) {
        return block.content;
      }
      return '';
    }).join('\n');

  for (const block of context.blocks) {
    text = text.replaceAll(`{{block-${block.key}}}`, block.content);
  }

  const stageVariable = {
    name: 'stage',
    type: 'string',
    value: stageKey,
  };

  if (Array.isArray(context.variables)) {
    const variable = context.variables.find((v) => v.name === 'stage');
    if (variable) {
      variable.value = stageKey;
    } else {
      context.variables.push(stageVariable);
    }
  } else {
    context.variables = [stageVariable];
  }

  const handlebarVariables = (context.variables || []).reduce<any>((acc, variable) => {
    acc[variable.name] = getVariableValue(variable) || '';
    return acc;
  }, {});

  // Place content from stages:
  handlebarVariables.stages = context.stages
    .filter((stage) => stage.enabled && stage.description)
    .map((stage) => `${stage.key}: ${stage.description}`)
    .join('\n');

  for (const block of context.blocks) {
    handlebarVariables[`block-${block.key}`] = block.content || '';
  }

  // Stages listing variable:
  for (const stage of context.stages) {
    const stageContent= stage.key === stageKey
      ? '\n\n' + stage.description
      : '';
    handlebarVariables[`stage-${stage.key}`] = stageContent || '';
  }

  // Stages range variable:
  const firstStage = context.stages[0];
  const lastStage = context.stages[context.stages.length - 1];
  handlebarVariables['stage-range'] = `${firstStage?.key}-${lastStage?.key}`;

  text = Handlebars.compile(text)(handlebarVariables);

  return text
}
