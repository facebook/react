import * as t from "@babel/types";

export type ComponentDeclaration = t.FunctionDeclaration & {
  __componentDeclaration: boolean;
};

export function isComponentDeclaration(
  node: t.FunctionDeclaration
): node is ComponentDeclaration {
  return Object.prototype.hasOwnProperty.call(node, "__componentDeclaration");
}

export function parseComponentDeclaration(
  node: t.FunctionDeclaration
): ComponentDeclaration | null {
  return isComponentDeclaration(node) ? node : null;
}
