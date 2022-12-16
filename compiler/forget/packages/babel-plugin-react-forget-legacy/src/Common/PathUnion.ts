/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, NodePath } from "@babel/traverse";

/**
 * A utility type to generate NodePath as a disjointed union type for better
 * type refinement and exhaustiveness check.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
 */
export type PathUnion<N extends Node | undefined | null> = N extends Node
  ? NodePath<N>
  : N extends undefined
  ? NodePath<undefined>
  : N extends null
  ? NodePath<null>
  : never;

/**
 * Cast @param path of type {@link NodePath} to {@link PathUnion}.
 *
 * This should only be used right before a type refinement (aka. narrowing):
 *
 *   const path = pathUnion(rawPath)
 *   switch(path.kind) {
 *     case "A":
 *       // path is now refined to NodePath<A>
 *   }
 */
export function pathUnion<N extends Node | null | undefined>(
  path: NodePath<N>
): PathUnion<N> {
  return path as PathUnion<N>;
}
