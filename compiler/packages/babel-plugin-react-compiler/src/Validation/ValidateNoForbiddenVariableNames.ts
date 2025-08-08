import {
  GeneratedSource,
  HIRFunction,
} from '../HIR';

import {CompilerError, ErrorSeverity} from '..';
export function validateNoForbiddenVariableNames(fn: HIRFunction) {
  const errors = new CompilerError();

  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {loc} = instr;

      console.log(instr)
      if (loc !== GeneratedSource && loc.identifierName === 'forbidden') {
        errors.push({
          reason:
            'Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)',
          description: null,
          severity: ErrorSeverity.InvalidReact,
          loc,
          suggestions: null,
        });
      }
    }}


  if (errors.hasErrors()) {
    throw errors;
  }
}
