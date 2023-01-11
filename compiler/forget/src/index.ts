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
import { compile, run } from "./CompilerPipeline";
import { lower } from "./HIR/BuildHIR";
import codegen from "./HIR/Codegen";
import { Environment } from "./HIR/HIRBuilder";
import printHIR, { printFunction } from "./HIR/PrintHIR";
import { inferMutableRanges, inferReferenceEffects } from "./Inference";
import { buildReactiveFunction } from "./ReactiveScopes/BuildReactiveFunctionWithoutScopes";
import { codegenReactiveFunction } from "./ReactiveScopes/CodegenReactiveFunction";
import { flattenReactiveLoops } from "./ReactiveScopes/FlattenReactiveLoops";
import { inferReactiveScopes } from "./ReactiveScopes/InferReactiveScopes";
import { inferReactiveScopeVariables } from "./ReactiveScopes/InferReactiveScopeVariables";
import { printReactiveFunction } from "./ReactiveScopes/PrintReactiveFunction";
import { propagateScopeDependencies } from "./ReactiveScopes/PropagateScopeDependencies";
import { pruneUnusedLabels } from "./ReactiveScopes/PruneUnusedLabels";
import { pruneUnusedScopes } from "./ReactiveScopes/PruneUnusedScopes";
import { eliminateRedundantPhi } from "./SSA/EliminateRedundantPhi";
import enterSSA from "./SSA/EnterSSA";
import { leaveSSA } from "./SSA/LeaveSSA";
import { inferTypes } from "./TypeInference";

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
  buildReactiveFunction,
  codegen,
  codegenReactiveFunction,
  compile,
  eliminateRedundantPhi,
  enterSSA,
  Environment,
  flattenReactiveLoops,
  inferMutableRanges,
  inferReactiveScopes,
  inferReactiveScopeVariables,
  inferReferenceEffects,
  inferTypes,
  leaveSSA,
  lower,
  parseFunctions,
  printFunction,
  printHIR,
  printReactiveFunction,
  propagateScopeDependencies,
  pruneUnusedLabels,
  pruneUnusedScopes,
  run,
};

export default BabelPlugin;
