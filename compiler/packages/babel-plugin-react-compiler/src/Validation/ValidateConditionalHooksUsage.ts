/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from '../CompilerError';
import {
  HIRFunction,
  CallExpression,
  MethodCall,
  Place,
} from '../HIR/HIR';
import {Result, Ok, Err} from '../Utils/Result';
import {computeUnconditionalBlocks} from '../HIR/ComputeUnconditionalBlocks';

/**
 * Enhanced React Compiler validation plugin to catch conditional hook usage
 * scenarios like the one fixed in PR #34116.
 * 
 * This plugin analyzes the HIR to detect hooks being called conditionally,
 * which violates the Rules of Hooks.
 */
export function validateConditionalHooksUsage(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const unconditionalBlocks = computeUnconditionalBlocks(fn);
  const errors = new CompilerError();

  // Check each instruction for hook calls in conditional blocks
  for (const [blockId, block] of fn.body.blocks) {
    const isUnconditional = unconditionalBlocks.has(blockId);

    for (const instruction of block.instructions) {
      switch (instruction.value.kind) {
        case 'CallExpression': {
          const callValue = instruction.value as CallExpression;
          if (isHookCall(callValue.callee) && !isUnconditional) {
            const error = new CompilerErrorDetail({
              reason:
                'Hook is called conditionally. Hooks must be called in the exact same order every time the component renders.',
              description:
                'This pattern can lead to "Rendered more hooks than during the previous render" errors. Consider moving the hook call outside the conditional logic or using a different approach.',
              loc: callValue.loc,
              severity: ErrorSeverity.InvalidReact,
              suggestions: null,
            });
            errors.pushErrorDetail(error);
          }
          break;
        }

        case 'MethodCall': {
          const methodValue = instruction.value as MethodCall;
          if (isHookCall(methodValue.property) && !isUnconditional) {
            const error = new CompilerErrorDetail({
              reason:
                'Hook method is called conditionally. Hooks must be called in the exact same order every time the component renders.',
              description:
                'This pattern can lead to "Rendered more hooks than during the previous render" errors. Consider moving the hook call outside the conditional logic.',
              loc: methodValue.loc,
              severity: ErrorSeverity.InvalidReact,
              suggestions: null,
            });
            errors.pushErrorDetail(error);
          }
          break;
        }
      }
    }
  }

  return errors.hasErrors() ? Err(errors) : Ok(undefined);
}

/**
 * Check if a place represents a React hook call
 */
function isHookCall(place: Place): boolean {
  if (!place.identifier.name) return false;
  const name = place.identifier.name.value;
  return name.startsWith('use') && name.length > 3 && /^[A-Z]/.test(name.slice(3));
}
