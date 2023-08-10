import * as t from "@babel/types";

type FunctionDeclOrExpr = t.FunctionDeclaration | t.ArrowFunctionExpression;
type ComponentDeclaration = FunctionDeclOrExpr & {
  __componentDeclaration: boolean;
};

export function isComponentDeclaration(
  node: FunctionDeclOrExpr
): node is ComponentDeclaration {
  return Object.prototype.hasOwnProperty.call(node, "__componentDeclaration");
}

export function parseComponentDeclaration(
  node: FunctionDeclOrExpr
): ComponentDeclaration | null {
  return isComponentDeclaration(node) ? node : null;
}
