/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  IdentifierId,
  makeInstructionId,
  MutableRange,
  Place,
  ReactiveValue,
} from '../HIR';
import {Macro, MacroMethod} from '../HIR/Environment';
import {eachReactiveValueOperand} from './visitors';

/**
 * This pass supports the `fbt` translation system (https://facebook.github.io/fbt/)
 * as well as similar user-configurable macro-like APIs where it's important that
 * the name of the function not be changed, and it's literal arguments not be turned
 * into temporaries.
 *
 * ## FBT
 *
 * FBT provides the `<fbt>` JSX element and `fbt()` calls (which take params in the
 * form of `<fbt:param>` children or `fbt.param()` arguments, respectively). These
 * tags/functions have restrictions on what types of syntax may appear as props/children/
 * arguments, notably that variable references may not appear directly — variables
 * must always be wrapped in a `<fbt:param>` or `fbt.param()`.
 *
 * To ensure that Forget doesn't rewrite code to violate this restriction, we force
 * operands to fbt tags/calls have the same scope as the tag/call itself.
 *
 * Note that this still allows the props/arguments of `<fbt:param>`/`fbt.param()`
 * to be independently memoized.
 *
 * ## User-defined macro-like function
 *
 * Users can also specify their own functions to be treated similarly to fbt via the
 * `customMacros` environment configuration.
 */
export function memoizeFbtAndMacroOperandsInSameScope(
  fn: HIRFunction,
): Set<IdentifierId> {
  const fbtMacroTags = new Set<Macro>([
    ...Array.from(FBT_TAGS).map((tag): Macro => [tag, []]),
    ...(fn.env.config.customMacros ?? []),
  ]);
  const fbtValues: Set<IdentifierId> = new Set();
  const macroMethods = new Map<IdentifierId, Array<Array<MacroMethod>>>();
  while (true) {
    let vsize = fbtValues.size;
    let msize = macroMethods.size;
    visit(fn, fbtMacroTags, fbtValues, macroMethods);
    if (vsize === fbtValues.size && msize === macroMethods.size) {
      break;
    }
  }
  return fbtValues;
}

export const FBT_TAGS: Set<string> = new Set([
  'fbt',
  'fbt:param',
  'fbs',
  'fbs:param',
]);
export const SINGLE_CHILD_FBT_TAGS: Set<string> = new Set([
  'fbt:param',
  'fbs:param',
]);

function visit(
  fn: HIRFunction,
  fbtMacroTags: Set<Macro>,
  fbtValues: Set<IdentifierId>,
  macroMethods: Map<IdentifierId, Array<Array<MacroMethod>>>,
): void {
  for (const [, block] of fn.body.blocks) {
    for (const instruction of block.instructions) {
      const {lvalue, value} = instruction;
      if (lvalue === null) {
        continue;
      }
      if (
        value.kind === 'Primitive' &&
        typeof value.value === 'string' &&
        matchesExactTag(value.value, fbtMacroTags)
      ) {
        /*
         * We don't distinguish between tag names and strings, so record
         * all `fbt` string literals in case they are used as a jsx tag.
         */
        fbtValues.add(lvalue.identifier.id);
      } else if (
        value.kind === 'LoadGlobal' &&
        matchesExactTag(value.binding.name, fbtMacroTags)
      ) {
        // Record references to `fbt` as a global
        fbtValues.add(lvalue.identifier.id);
      } else if (
        value.kind === 'LoadGlobal' &&
        matchTagRoot(value.binding.name, fbtMacroTags) !== null
      ) {
        const methods = matchTagRoot(value.binding.name, fbtMacroTags)!;
        macroMethods.set(lvalue.identifier.id, methods);
      } else if (
        value.kind === 'PropertyLoad' &&
        macroMethods.has(value.object.identifier.id)
      ) {
        const methods = macroMethods.get(value.object.identifier.id)!;
        const newMethods = [];
        for (const method of methods) {
          if (
            method.length > 0 &&
            (method[0].type === 'wildcard' ||
              (method[0].type === 'name' && method[0].name === value.property))
          ) {
            if (method.length > 1) {
              newMethods.push(method.slice(1));
            } else {
              fbtValues.add(lvalue.identifier.id);
            }
          }
        }
        if (newMethods.length > 0) {
          macroMethods.set(lvalue.identifier.id, newMethods);
        }
      } else if (isFbtCallExpression(fbtValues, value)) {
        const fbtScope = lvalue.identifier.scope;
        if (fbtScope === null) {
          continue;
        }

        /*
         * if the JSX element's tag was `fbt`, mark all its operands
         * to ensure that they end up in the same scope as the jsx element
         * itself.
         */
        for (const operand of eachReactiveValueOperand(value)) {
          operand.identifier.scope = fbtScope;

          // Expand the jsx element's range to account for its operands
          expandFbtScopeRange(fbtScope.range, operand.identifier.mutableRange);
          fbtValues.add(operand.identifier.id);
        }
      } else if (
        isFbtJsxExpression(fbtMacroTags, fbtValues, value) ||
        isFbtJsxChild(fbtValues, lvalue, value)
      ) {
        const fbtScope = lvalue.identifier.scope;
        if (fbtScope === null) {
          continue;
        }

        /*
         * if the JSX element's tag was `fbt`, mark all its operands
         * to ensure that they end up in the same scope as the jsx element
         * itself.
         */
        for (const operand of eachReactiveValueOperand(value)) {
          operand.identifier.scope = fbtScope;

          // Expand the jsx element's range to account for its operands
          expandFbtScopeRange(fbtScope.range, operand.identifier.mutableRange);

          /*
           * NOTE: we add the operands as fbt values so that they are also
           * grouped with this expression
           */
          fbtValues.add(operand.identifier.id);
        }
      } else if (fbtValues.has(lvalue.identifier.id)) {
        const fbtScope = lvalue.identifier.scope;
        if (fbtScope === null) {
          return;
        }

        for (const operand of eachReactiveValueOperand(value)) {
          if (
            operand.identifier.name !== null &&
            operand.identifier.name.kind === 'named'
          ) {
            /*
             * named identifiers were already locals, we only have to force temporaries
             * into the same scope
             */
            continue;
          }
          operand.identifier.scope = fbtScope;

          // Expand the jsx element's range to account for its operands
          expandFbtScopeRange(fbtScope.range, operand.identifier.mutableRange);
        }
      }
    }
  }
}

function matchesExactTag(s: string, tags: Set<Macro>): boolean {
  return Array.from(tags).some(macro =>
    typeof macro === 'string'
      ? s === macro
      : macro[1].length === 0 && macro[0] === s,
  );
}

function matchTagRoot(
  s: string,
  tags: Set<Macro>,
): Array<Array<MacroMethod>> | null {
  const methods: Array<Array<MacroMethod>> = [];
  for (const macro of tags) {
    if (typeof macro === 'string') {
      continue;
    }
    const [tag, rest] = macro;
    if (tag === s && rest.length > 0) {
      methods.push(rest);
    }
  }
  if (methods.length > 0) {
    return methods;
  } else {
    return null;
  }
}

function isFbtCallExpression(
  fbtValues: Set<IdentifierId>,
  value: ReactiveValue,
): boolean {
  return (
    (value.kind === 'CallExpression' &&
      fbtValues.has(value.callee.identifier.id)) ||
    (value.kind === 'MethodCall' && fbtValues.has(value.property.identifier.id))
  );
}

function isFbtJsxExpression(
  fbtMacroTags: Set<Macro>,
  fbtValues: Set<IdentifierId>,
  value: ReactiveValue,
): boolean {
  return (
    value.kind === 'JsxExpression' &&
    ((value.tag.kind === 'Identifier' &&
      fbtValues.has(value.tag.identifier.id)) ||
      (value.tag.kind === 'BuiltinTag' &&
        matchesExactTag(value.tag.name, fbtMacroTags)))
  );
}

function isFbtJsxChild(
  fbtValues: Set<IdentifierId>,
  lvalue: Place | null,
  value: ReactiveValue,
): boolean {
  return (
    (value.kind === 'JsxExpression' || value.kind === 'JsxFragment') &&
    lvalue !== null &&
    fbtValues.has(lvalue.identifier.id)
  );
}

function expandFbtScopeRange(
  fbtRange: MutableRange,
  extendWith: MutableRange,
): void {
  if (extendWith.start !== 0) {
    fbtRange.start = makeInstructionId(
      Math.min(fbtRange.start, extendWith.start),
    );
  }
}
