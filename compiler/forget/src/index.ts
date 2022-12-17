/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BabelPlugin from "./Babel/BabelPlugin";

declare global {
  var __DEV__: boolean | null | undefined;
}

import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { lower } from "./HIR/BuildHIR";
import codegen from "./HIR/Codegen";
import { Environment } from "./HIR/HIRBuilder";
import { inferMutableRanges } from "./HIR/InferMutableRanges";
import inferReferenceEffects from "./HIR/InferReferenceEffects";
import printHIR, { printFunction } from "./HIR/PrintHIR";
import { buildReactiveFunction } from "./ReactiveScopes/BuildReactiveFunction";
import { codegenReactiveFunction } from "./ReactiveScopes/CodegenReactiveFunction";
import { flattenReactiveLoops } from "./ReactiveScopes/FlattenReactiveLoops";
import { inferReactiveScopes } from "./ReactiveScopes/InferReactiveScopes";
import { inferReactiveScopeVariables } from "./ReactiveScopes/InferReactiveScopeVariables";
import { printReactiveFunction } from "./ReactiveScopes/PrintReactiveFunction";
import { propagateScopeDependencies } from "./ReactiveScopes/PropagateScopeDependencies";
import { pruneUnusedLabels } from "./ReactiveScopes/PruneUnusedLabels";
import { eliminateRedundantPhi } from "./SSA/EliminateRedundantPhi";
import enterSSA from "./SSA/EnterSSA";
import { leaveSSA } from "./SSA/LeaveSSA";

function parseFunctions(
  source: string
): Array<NodePath<t.FunctionDeclaration>> {
  try {
    const ast = parse(source, {
      plugins: ["typescript", "jsx"],
    });
    const items: Array<NodePath<t.FunctionDeclaration>> = [];
    traverse(ast, {
      FunctionDeclaration: {
        enter(nodePath) {
          items.push(nodePath);
        },
      },
    });
    return items;
  } catch (e) {
    return [];
  }
}

export const HIR = {
  codegenReactiveFunction,
  flattenReactiveLoops,
  propagateScopeDependencies,
  buildReactiveFunction,
  codegen,
  eliminateRedundantPhi,
  enterSSA,
  Environment,
  inferMutableRanges,
  inferReactiveScopes,
  inferReactiveScopeVariables,
  inferReferenceEffects,
  leaveSSA,
  lower,
  parseFunctions,
  printFunction,
  printHIR,
  printReactiveFunction,
  pruneUnusedLabels,
};

export default BabelPlugin;
