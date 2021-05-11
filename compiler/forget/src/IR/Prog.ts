/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { Func } from "./Func";

export class Prog {
  ast: NodePath<t.Program>;

  funcs: Map<NodePath<t.Function>, Func> = new Map();

  constructor(ast: NodePath<t.Program>) {
    this.ast = ast;
  }
}
