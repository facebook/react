/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import * as t from "@babel/types";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import path from "path";

import * as CompilerPipeline from "../CompilerPipeline";
import { Effect, ValueKind } from "../HIR";
import { printFunction } from "../HIR/PrintHIR";
import { EnvironmentOptions } from "../HIR/Environment";
import { Result, Ok, Err } from "../Utils/Result";
import { toggleLogging } from "../Utils/logger";
import generateTestsFromFixtures from "./test-utils/generateTestsFromFixtures";
import invariant from "invariant";

// TODO: make pipeline names an enum
// Currently, this is the last pass that operates on hir
const LAST_HIR_PASS = "LeaveSSA";

describe("React Forget (HIR version)", () => {
  generateTestsFromFixtures(
    path.join(__dirname, "fixtures", "hir"),
    (input, file, options) => {
      if (options.debug) {
        toggleLogging(options.debug);
      }

      const compileResult = compile(input, options.language, {
        customHooks: new Map([
          [
            "useFreeze",
            {
              name: "useFreeze",
              kind: "Custom",
              valueKind: ValueKind.Frozen,
              effectKind: Effect.Freeze,
            },
          ],
        ]),
      });

      if (compileResult.isErr()) {
        const error = compileResult.unwrapErr();
        error.message = `Expected fixture '${file}' to succeed but it failed with error:\n\n${error.message}`;
        throw error;
      }
      const transformedSources = compileResult.unwrap().map(({ hir }) => {
        return `
## HIR

${wrapWithTripleBackticks(hir, "javascript")}

        `.trim();
      });
      if (transformedSources === null || transformedSources.length === 0) {
        throw new Error(`Expected at least one output for file '${file}'.`);
      }
      return `
## Input

${wrapWithTripleBackticks(input, "javascript")}

${transformedSources.join("\n")}
      `;
    }
  );
});

type CompileResult = {
  hir: string;
};

function compile(
  source: string,
  language: "flow" | "typescript",
  compilerEnv: Partial<EnvironmentOptions>
): Result<Array<CompileResult>, Error> {
  const transformedFns = new Array<CompileResult>();
  const babelAsts = parseFunctions(source, language);
  if (babelAsts.isErr()) {
    return babelAsts;
  }

  try {
    for (const ast of babelAsts.unwrap()) {
      let hirString: string | null = null;
      for (const result of CompilerPipeline.run(ast, compilerEnv)) {
        switch (result.kind) {
          case "hir": {
            if (result.name === LAST_HIR_PASS) {
              hirString = printFunction(result.value);
              break;
            }
          }
        }
      }
      invariant(
        hirString !== null,
        `Expected to find pass with name ${LAST_HIR_PASS}`
      );
      transformedFns.push({ hir: hirString });
    }
    return Ok(transformedFns);
  } catch (e) {
    return Err(e);
  }
}

function parseFunctions(
  source: string,
  language: "flow" | "typescript"
): Result<Array<NodePath<t.FunctionDeclaration>>, Error> {
  const items: Array<NodePath<t.FunctionDeclaration>> = [];
  try {
    const ast = parse(source, {
      plugins: [language, "jsx"],
      sourceType: "module",
    });
    traverse(ast, {
      // Only collect top-level functions
      FunctionDeclaration(nodePath) {
        items.push(nodePath);
        nodePath.skip();
      },
    });
  } catch (e) {
    return Err(e);
  }
  return Ok(items);
}

function wrapWithTripleBackticks(s: string, ext?: string) {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}
