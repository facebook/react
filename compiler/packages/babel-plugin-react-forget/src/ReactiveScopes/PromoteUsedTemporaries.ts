/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import { GeneratedSource } from "../HIR";
import {
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveValue,
  promoteTemporaryJsxTagToNamedIdentifier,
  promoteTemporaryToNamedIdentifier,
} from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

type VisitorState = {
  tags: JsxExpressionTags;
};
class Visitor extends ReactiveFunctionVisitor<VisitorState> {
  override visitScope(block: ReactiveScopeBlock, state: VisitorState): void {
    this.traverseScope(block, state);
    for (const dep of block.scope.dependencies) {
      const { identifier } = dep;
      if (identifier.name == null) {
        promoteTemporary(identifier, state);
      }
    }
    /*
     * This is technically optional. We could prune ReactiveScopes
     * whose outputs are not used in another computation or return
     * value.
     * Many of our current test fixtures do not return a value, so
     * it is better for now to promote (and memoize) every output.
     */
    for (const [, declaration] of block.scope.declarations) {
      if (declaration.identifier.name == null) {
        promoteTemporary(declaration.identifier, state);
      }
    }
  }

  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: VisitorState
  ): void {
    this.traverseValue(id, value, state);
    if (value.kind === "FunctionExpression" || value.kind === "ObjectMethod") {
      for (const operand of value.loweredFunc.func.params) {
        const place = operand.kind === "Identifier" ? operand : operand.place;
        if (place.identifier.name === null) {
          promoteTemporary(place.identifier, state);
        }
      }
    }
  }

  override visitReactiveFunctionValue(
    _id: InstructionId,
    _dependencies: Place[],
    fn: ReactiveFunction,
    state: VisitorState
  ): void {
    for (const operand of fn.params) {
      const place = operand.kind === "Identifier" ? operand : operand.place;
      if (place.identifier.name === null) {
        promoteTemporary(place.identifier, state);
      }
    }
    visitReactiveFunction(fn, this, state);
  }
}

type JsxExpressionTags = Set<IdentifierId>;
class CollectJsxTagsVisitor extends ReactiveFunctionVisitor<JsxExpressionTags> {
  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: JsxExpressionTags
  ): void {
    this.traverseValue(id, value, state);
    if (value.kind === "JsxExpression" && value.tag.kind === "Identifier") {
      state.add(value.tag.identifier.id);
    }
  }
}

export function promoteUsedTemporaries(fn: ReactiveFunction): void {
  const tags: JsxExpressionTags = new Set();
  visitReactiveFunction(fn, new CollectJsxTagsVisitor(), tags);
  const state: VisitorState = {
    tags,
  };
  for (const operand of fn.params) {
    const place = operand.kind === "Identifier" ? operand : operand.place;
    if (place.identifier.name === null) {
      promoteTemporary(place.identifier, state);
    }
  }
  visitReactiveFunction(fn, new Visitor(), state);
}

function promoteTemporary(identifier: Identifier, state: VisitorState): void {
  CompilerError.invariant(identifier.name === null, {
    reason:
      "promoteTemporary: Expected to be called only for temporary variables",
    description: null,
    loc: GeneratedSource,
    suggestions: null,
  });
  if (state.tags.has(identifier.id)) {
    promoteTemporaryJsxTagToNamedIdentifier(identifier);
  } else {
    promoteTemporaryToNamedIdentifier(identifier);
  }
}
