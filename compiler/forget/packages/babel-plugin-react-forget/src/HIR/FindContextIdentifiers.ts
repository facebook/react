import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { CompilerError } from "../CompilerError";
import { GeneratedSource } from "./HIR";

type FindContextIdentifierState = {
  inLambda: number;
  currentLambda: Array<
    | NodePath<t.FunctionDeclaration>
    | NodePath<t.FunctionExpression>
    | NodePath<t.ArrowFunctionExpression>
  >;
  contextIdentifiers: Set<t.Identifier>;
};

export function findContextIdentifiers(
  func: NodePath<t.Function>
): Set<t.Identifier> {
  const state: FindContextIdentifierState = {
    inLambda: 0,
    currentLambda: [],
    contextIdentifiers: new Set(),
  };

  func.traverse<FindContextIdentifierState>(
    {
      FunctionDeclaration: {
        enter(
          fn: NodePath<t.FunctionDeclaration>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.push(fn);
        },
        exit(
          fn: NodePath<t.FunctionDeclaration>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.pop();
        },
      },
      FunctionExpression: {
        enter(
          fn: NodePath<t.FunctionExpression>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.push(fn);
        },
        exit(
          _fn: NodePath<t.FunctionExpression>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.pop();
        },
      },

      ArrowFunctionExpression: {
        enter(
          fn: NodePath<t.ArrowFunctionExpression>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.push(fn);
        },
        exit(
          _fn: NodePath<t.ArrowFunctionExpression>,
          state: FindContextIdentifierState
        ): void {
          state.currentLambda.pop();
        },
      },
      AssignmentExpression(
        path: NodePath<t.AssignmentExpression>,
        state: FindContextIdentifierState
      ): void {
        const currentLambda = state.currentLambda.at(-1);
        if (currentLambda) {
          const left = path.get("left");
          handleAssignment(currentLambda, state.contextIdentifiers, left);
        }
      },
    },
    state
  );
  return state.contextIdentifiers;
}

function handleAssignment(
  currentLambda:
    | NodePath<t.FunctionDeclaration>
    | NodePath<t.FunctionExpression>
    | NodePath<t.ArrowFunctionExpression>,
  contextIdentifiers: Set<t.Identifier>,
  lvalPath: NodePath<t.LVal>
): void {
  // Find all reassignments to identifiers declared outside of currentLambda
  // This closely follows destructuring assignment assumptions and logic in BuildHIR
  const lvalNode = lvalPath.node;
  switch (lvalNode.type) {
    case "Identifier": {
      const path = lvalPath as NodePath<t.Identifier>;
      const name = path.node.name;
      const ownBinding = path.scope.getBinding(name);
      const bindingAboveLambdaScope =
        currentLambda.scope.parent.getBinding(name);

      if (ownBinding != null && ownBinding === bindingAboveLambdaScope) {
        contextIdentifiers.add(ownBinding.identifier);
      }
      break;
    }
    case "ArrayPattern": {
      const path = lvalPath as NodePath<t.ArrayPattern>;
      for (const element of path.get("elements")) {
        if (nonNull(element)) {
          handleAssignment(currentLambda, contextIdentifiers, element);
        }
      }
      break;
    }
    case "ObjectPattern": {
      const path = lvalPath as NodePath<t.ObjectPattern>;
      for (const property of path.get("properties")) {
        if (property.isObjectProperty()) {
          const valuePath = property.get("value");
          if (!valuePath.isLVal()) {
            CompilerError.invariant(
              `[FindContextIdentifiers] Expected object property value to be an LVal, got: ${valuePath.type}`,
              valuePath.node.loc ?? GeneratedSource
            );
          }
          handleAssignment(currentLambda, contextIdentifiers, valuePath);
        } else {
          if (!property.isRestElement()) {
            CompilerError.invariant(
              `[FindContextIdentifiers] Invalid assumptions for babel types.`,
              property.node.loc ?? GeneratedSource
            );
          }
          handleAssignment(currentLambda, contextIdentifiers, property);
        }
      }
      break;
    }
    case "AssignmentPattern": {
      const path = lvalPath as NodePath<t.AssignmentPattern>;
      const left = path.get("left");
      handleAssignment(currentLambda, contextIdentifiers, left);
      break;
    }
    case "RestElement": {
      const path = lvalPath as NodePath<t.RestElement>;
      handleAssignment(currentLambda, contextIdentifiers, path.get("argument"));
      break;
    }
    case "MemberExpression": {
      // Interior mutability (not a reassign)
      break;
    }
    default: {
      CompilerError.todo(
        `[FindContextIdentifiers] Cannot handle Object destructuring assignment target ${lvalNode.type}`,
        lvalNode.loc ?? GeneratedSource
      );
    }
  }
}

function nonNull<T extends NonNullable<t.Node>>(
  t: NodePath<T | null>
): t is NodePath<T> {
  return t.node != null;
}
