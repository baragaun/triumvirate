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

export function compileLlmInstructions(
  context: LlmContext,
  stageKey: string | null | undefined,
  variables: LlmContextVariable[] = [],
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

  // Replace variables that were passed in:
  if (Array.isArray(variables) && variables.length > 0) {
    for (const variable of variables) {
      text = text.replaceAll(`{{${variable.name}}}`, getVariableValue(variable) || '');
    }
  }

  // Replace variables from the context:
  for (const variable of context.variables) {
    text = text.replaceAll(`{{${variable.name}}}`, getVariableValue(variable) || '');
  }

  // Place content from stages:
  const stagesText = context.stages
    .filter((stage) => stage.enabled && stage.description)
    .map((stage) => `${stage.key}: ${stage.description}`)
    .join('\n');
  text = text.replaceAll(`{{stages}}`, stagesText);

  // Stages listing variable:
  for (const stage of context.stages) {
    const stageContent= stage.key === stageKey
      ? '\n\n' + stage.description
      : '';
    text = text.replaceAll(`{{stage-${stage.key}}}`, stageContent || '');
  }

  // Stages range variable:
  const firstStage = context.stages[0];
  const lastStage = context.stages[context.stages.length - 1];
  text = text.replaceAll('{{STAGES-RANGE}}', `${firstStage?.key}-${lastStage?.key}`);

  return text
}
