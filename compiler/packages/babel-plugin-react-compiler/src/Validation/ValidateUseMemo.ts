/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  ErrorSeverity,
} from '../CompilerError';
import {FunctionExpression, HIRFunction, IdentifierId} from '../HIR';
import {Result} from '../Utils/Result';

export function validateUseMemo(fn: HIRFunction): Result<void, CompilerError> {
  const errors = new CompilerError();
  const useMemos = new Set<IdentifierId>();
  const react = new Set<IdentifierId>();
  const functions = new Map<IdentifierId, FunctionExpression>();
  for (const [, block] of fn.body.blocks) {
    for (const {lvalue, value} of block.instructions) {
      switch (value.kind) {
        case 'LoadGlobal': {
          if (value.binding.name === 'useMemo') {
            useMemos.add(lvalue.identifier.id);
          } else if (value.binding.name === 'React') {
            react.add(lvalue.identifier.id);
          }
          break;
        }
        case 'PropertyLoad': {
          if (react.has(value.object.identifier.id)) {
            if (value.property === 'useMemo') {
              useMemos.add(lvalue.identifier.id);
            }
          }
          break;
        }
        case 'FunctionExpression': {
          functions.set(lvalue.identifier.id, value);
          break;
        }
        case 'MethodCall':
        case 'CallExpression': {
          // Is the function being called useMemo, with at least 1 argument?
          const callee =
            value.kind === 'CallExpression'
              ? value.callee.identifier.id
              : value.property.identifier.id;
          const isUseMemo = useMemos.has(callee);
          if (!isUseMemo || value.args.length === 0) {
            continue;
          }

          /*
           * If yes get the first argument and if it refers to a locally defined function
           * expression, validate the function
           */
          const [arg] = value.args;
          if (arg.kind !== 'Identifier') {
            continue;
          }
          const body = functions.get(arg.identifier.id);
          if (body === undefined) {
            continue;
          }

          if (body.loweredFunc.func.params.length > 0) {
            const firstParam = body.loweredFunc.func.params[0];
            const loc =
              firstParam.kind === 'Identifier'
                ? firstParam.loc
                : firstParam.place.loc;
            errors.pushDiagnostic(
              CompilerDiagnostic.create({
                severity: ErrorSeverity.InvalidReact,
                category: 'useMemo() callbacks may not accept parameters',
                description:
                  'useMemo() callbacks are called by React to cache calculations across re-renders. They should not take parameters. Instead, directly reference the props, state, or local variables needed for the computation.',
                suggestions: null,
              }).withDetail({
                kind: 'error',
                loc,
                message: 'Callbacks with parameters are not supported',
              }),
            );
          }

          if (body.loweredFunc.func.async || body.loweredFunc.func.generator) {
            errors.pushDiagnostic(
              CompilerDiagnostic.create({
                severity: ErrorSeverity.InvalidReact,
                category:
                  'useMemo() callbacks may not be async or generator functions',
                description:
                  'useMemo() callbacks are called once and must synchronously return a value.',
                suggestions: null,
              }).withDetail({
                kind: 'error',
                loc: body.loc,
                message: 'Async and generator functions are not supported',
              }),
            );
          }

          break;
        }
      }
    }
  }
  return errors.asResult();
}
