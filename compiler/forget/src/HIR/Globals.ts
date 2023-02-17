/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";

const GLOBALS: Map<string, t.Identifier> = new Map([
  ["Map", t.identifier("Map")],
  ["Set", t.identifier("Set")],
  ["Math", t.identifier("Math")],
]);

export type Global = {
  name: string;
};

// TODO: This will work as a stopgap but it isn't really correct. We need proper handling of globals
// and module-scoped variables, which means understanding module constants and imports.
export function getGlobalDeclaration(identifierName: string): Global | null {
  const ident = GLOBALS.get(identifierName);
  if (ident != null) {
    return ident;
  }
  // TODO: return null if not explicitly configured by the user
  return { name: identifierName };
}
