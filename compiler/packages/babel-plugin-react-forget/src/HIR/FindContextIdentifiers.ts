/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { Set_union } from "../Utils/utils";
import { GeneratedSource } from "./HIR";

type BabelFunction =
  | NodePath<t.FunctionDeclaration>
  | NodePath<t.FunctionExpression>
  | NodePath<t.ArrowFunctionExpression>
  | NodePath<t.ObjectMethod>;
type FindContextIdentifierState = {
  currentFn: Array<BabelFunction>;
  reassigned: Set<t.Identifier>;
  referenced: Set<t.Identifier>;
};

const withFunctionScope = {
  enter: function (
    path: BabelFunction,
    state: FindContextIdentifierState
  ): void {
    state.currentFn.push(path);
  },
  exit: function (_: BabelFunction, state: FindContextIdentifierState): void {
    state.currentFn.pop();
  },
};

export function findContextIdentifiers(
  func: NodePath<t.Function>
): Set<t.Identifier> {
  const state: FindContextIdentifierState = {
    currentFn: [],
    reassigned: new Set(),
    referenced: new Set(),
  };

  func.traverse<FindContextIdentifierState>(
    {
      FunctionDeclaration: withFunctionScope,
      FunctionExpression: withFunctionScope,
      ArrowFunctionExpression: withFunctionScope,
      ObjectMethod: withFunctionScope,
      AssignmentExpression(
        path: NodePath<t.AssignmentExpression>,
        state: FindContextIdentifierState
      ): void {
        const left = path.get("left");
        handleAssignment(state.reassigned, left);
      },
      Identifier(
        path: NodePath<t.Identifier>,
        state: FindContextIdentifierState
      ): void {
        const currentFn = state.currentFn.at(-1);
        if (currentFn !== undefined)
          handleIdentifier(currentFn, state.referenced, path);
      },
    },
    state
  );
  return Set_union(state.reassigned, state.referenced);
}

function handleIdentifier(
  currentFn: BabelFunction,
  referenced: Set<t.Identifier>,
  path: NodePath<t.Identifier>
): void {
  const name = path.node.name;
  const binding = path.scope.getBinding(name);
  const bindingAboveLambdaScope = currentFn.scope.parent.getBinding(name);

  if (binding != null && binding === bindingAboveLambdaScope) {
    referenced.add(binding.identifier);
  }
}

function handleAssignment(
  reassigned: Set<t.Identifier>,
  lvalPath: NodePath<t.LVal>
): void {
  /*
   * Find all reassignments to identifiers declared outside of currentFn
   * This closely follows destructuring assignment assumptions and logic in BuildHIR
   */
  const lvalNode = lvalPath.node;
  switch (lvalNode.type) {
    case "Identifier": {
      const path = lvalPath as NodePath<t.Identifier>;
      const name = path.node.name;
      const binding = path.scope.getBinding(name);
      if (binding != null) {
        reassigned.add(binding.identifier);
      }
      break;
    }
    case "ArrayPattern": {
      const path = lvalPath as NodePath<t.ArrayPattern>;
      for (const element of path.get("elements")) {
        if (nonNull(element)) {
          handleAssignment(reassigned, element);
        }
      }
      break;
    }
    case "ObjectPattern": {
      const path = lvalPath as NodePath<t.ObjectPattern>;
      for (const property of path.get("properties")) {
        if (property.isObjectProperty()) {
          const valuePath = property.get("value");
          CompilerError.invariant(valuePath.isLVal(), {
            reason: `[FindContextIdentifiers] Expected object property value to be an LVal, got: ${valuePath.type}`,
            description: null,
            loc: valuePath.node.loc ?? GeneratedSource,
            suggestions: null,
          });
          handleAssignment(reassigned, valuePath);
        } else {
          CompilerError.invariant(property.isRestElement(), {
            reason: `[FindContextIdentifiers] Invalid assumptions for babel types.`,
            description: null,
            loc: property.node.loc ?? GeneratedSource,
            suggestions: null,
          });
          handleAssignment(reassigned, property);
        }
      }
      break;
    }
    case "AssignmentPattern": {
      const path = lvalPath as NodePath<t.AssignmentPattern>;
      const left = path.get("left");
      handleAssignment(reassigned, left);
      break;
    }
    case "RestElement": {
      const path = lvalPath as NodePath<t.RestElement>;
      handleAssignment(reassigned, path.get("argument"));
      break;
    }
    case "MemberExpression": {
      // Interior mutability (not a reassign)
      break;
    }
    default: {
      CompilerError.throwTodo({
        reason: `[FindContextIdentifiers] Cannot handle Object destructuring assignment target ${lvalNode.type}`,
        description: null,
        loc: lvalNode.loc ?? GeneratedSource,
        suggestions: null,
      });
    }
  }
}

function nonNull<T extends NonNullable<t.Node>>(
  t: NodePath<T | null>
): t is NodePath<T> {
  return t.node != null;
}
