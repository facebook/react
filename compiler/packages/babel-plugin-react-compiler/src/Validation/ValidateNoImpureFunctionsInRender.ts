/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '..';
import {HIRFunction} from '../HIR';
import {getFunctionCallSignature} from '../Inference/InferReferenceEffects';
import {Result} from '../Utils/Result';

/**
 * Checks that known-impure functions are not called during render. Examples of invalid functions to
 * call during render are `Math.random()` and `Date.now()`. Users may extend this set of
 * impure functions via a module type provider and specifying functions with `impure: true`.
 *
 * TODO: add best-effort analysis of functions which are called during render. We have variations of
 * this in several of our validation passes and should unify those analyses into a reusable helper
 * and use it here.
 */
export function validateNoImpureFunctionsInRender(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const value = instr.value;
      if (value.kind === 'MethodCall' || value.kind == 'CallExpression') {
        const callee =
          value.kind === 'MethodCall' ? value.property : value.callee;
        const signature = getFunctionCallSignature(
          fn.env,
          callee.identifier.type,
        );
        if (signature != null && signature.impure === true) {
          errors.push({
            reason:
              'Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)',
            description:
              signature.canonicalName != null
                ? `\`${signature.canonicalName}\` is an impure function whose results may change on every call`
                : null,
            severity: ErrorSeverity.InvalidReact,
            loc: callee.loc,
            suggestions: null,
          });
        }
      }
    }
  }
  return errors.asResult();
}
