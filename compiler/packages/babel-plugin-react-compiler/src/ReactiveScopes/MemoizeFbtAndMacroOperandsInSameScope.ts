/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionValue,
  makeInstructionId,
  MutableRange,
  Place,
  ReactiveScope,
} from '../HIR';
import {Macro, MacroMethod} from '../HIR/Environment';
import {eachInstructionValueOperand} from '../HIR/visitors';
import {Iterable_some} from '../Utils/utils';

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
  /**
   * Set of all identifiers that load fbt or other macro functions or their nested
   * properties, as well as values known to be the results of invoking macros
   */
  const macroTagsCalls: Set<IdentifierId> = new Set();
  /**
   * Mapping of lvalue => list of operands for all expressions where either
   * the lvalue is a known fbt/macro call and/or the operands transitively
   * contain fbt/macro calls.
   *
   * This is the key data structure that powers the scope merging: we start
   * at the lvalues and merge operands into the lvalue's scope.
   */
  const macroValues: Map<Identifier, Array<Identifier>> = new Map();
  // Tracks methods loaded from macros, like fbt.param or idx.foo
  const macroMethods = new Map<IdentifierId, Array<Array<MacroMethod>>>();

  visit(fn, fbtMacroTags, macroTagsCalls, macroMethods, macroValues);

  for (const root of macroValues.keys()) {
    const scope = root.scope;
    if (scope == null) {
      continue;
    }
    // Merge the operands into the same scope if this is a known macro invocation
    if (!macroTagsCalls.has(root.id)) {
      continue;
    }
    mergeScopes(root, scope, macroValues, macroTagsCalls);
  }

  return macroTagsCalls;
}

export const FBT_TAGS: Set<string> = new Set([
  'fbt',
  'fbt:param',
  'fbt:enum',
  'fbt:plural',
  'fbs',
  'fbs:param',
  'fbs:enum',
  'fbs:plural',
]);
export const SINGLE_CHILD_FBT_TAGS: Set<string> = new Set([
  'fbt:param',
  'fbs:param',
]);

function visit(
  fn: HIRFunction,
  fbtMacroTags: Set<Macro>,
  macroTagsCalls: Set<IdentifierId>,
  macroMethods: Map<IdentifierId, Array<Array<MacroMethod>>>,
  macroValues: Map<Identifier, Array<Identifier>>,
): void {
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      const macroOperands: Array<Identifier> = [];
      for (const operand of phi.operands.values()) {
        if (macroValues.has(operand.identifier)) {
          macroOperands.push(operand.identifier);
        }
      }
      if (macroOperands.length !== 0) {
        macroValues.set(phi.place.identifier, macroOperands);
      }
    }
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
        macroTagsCalls.add(lvalue.identifier.id);
      } else if (
        value.kind === 'LoadGlobal' &&
        matchesExactTag(value.binding.name, fbtMacroTags)
      ) {
        // Record references to `fbt` as a global
        macroTagsCalls.add(lvalue.identifier.id);
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
              macroTagsCalls.add(lvalue.identifier.id);
            }
          }
        }
        if (newMethods.length > 0) {
          macroMethods.set(lvalue.identifier.id, newMethods);
        }
      } else if (
        value.kind === 'PropertyLoad' &&
        macroTagsCalls.has(value.object.identifier.id)
      ) {
        macroTagsCalls.add(lvalue.identifier.id);
      } else if (
        isFbtJsxExpression(fbtMacroTags, macroTagsCalls, value) ||
        isFbtJsxChild(macroTagsCalls, lvalue, value) ||
        isFbtCallExpression(macroTagsCalls, value)
      ) {
        macroTagsCalls.add(lvalue.identifier.id);
        macroValues.set(
          lvalue.identifier,
          Array.from(
            eachInstructionValueOperand(value),
            operand => operand.identifier,
          ),
        );
      } else if (
        Iterable_some(eachInstructionValueOperand(value), operand =>
          macroValues.has(operand.identifier),
        )
      ) {
        const macroOperands: Array<Identifier> = [];
        for (const operand of eachInstructionValueOperand(value)) {
          if (macroValues.has(operand.identifier)) {
            macroOperands.push(operand.identifier);
          }
        }
        macroValues.set(lvalue.identifier, macroOperands);
      }
    }
  }
}

function mergeScopes(
  root: Identifier,
  scope: ReactiveScope,
  macroValues: Map<Identifier, Array<Identifier>>,
  macroTagsCalls: Set<IdentifierId>,
): void {
  const operands = macroValues.get(root);
  if (operands == null) {
    return;
  }
  for (const operand of operands) {
    operand.scope = scope;
    expandFbtScopeRange(scope.range, operand.mutableRange);
    macroTagsCalls.add(operand.id);
    mergeScopes(operand, scope, macroValues, macroTagsCalls);
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
  macroTagsCalls: Set<IdentifierId>,
  value: InstructionValue,
): boolean {
  return (
    (value.kind === 'CallExpression' &&
      macroTagsCalls.has(value.callee.identifier.id)) ||
    (value.kind === 'MethodCall' &&
      macroTagsCalls.has(value.property.identifier.id))
  );
}

function isFbtJsxExpression(
  fbtMacroTags: Set<Macro>,
  macroTagsCalls: Set<IdentifierId>,
  value: InstructionValue,
): boolean {
  return (
    value.kind === 'JsxExpression' &&
    ((value.tag.kind === 'Identifier' &&
      macroTagsCalls.has(value.tag.identifier.id)) ||
      (value.tag.kind === 'BuiltinTag' &&
        matchesExactTag(value.tag.name, fbtMacroTags)))
  );
}

function isFbtJsxChild(
  macroTagsCalls: Set<IdentifierId>,
  lvalue: Place | null,
  value: InstructionValue,
): boolean {
  return (
    (value.kind === 'JsxExpression' || value.kind === 'JsxFragment') &&
    lvalue !== null &&
    macroTagsCalls.has(lvalue.identifier.id)
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
