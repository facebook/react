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

// TODO: This will work as a stopgap but it isn't really correct. We need proper handling of globals
// and module-scoped variables, which means understanding module constants and imports.
export function getOrAddGlobal(identifierName: string): t.Identifier {
  const ident = GLOBALS.get(identifierName);
  if (ident != null) {
    return ident;
  }
  const newIdent = t.identifier(identifierName);
  GLOBALS.set(identifierName, newIdent);
  return newIdent;
}
