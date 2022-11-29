/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import generate from "@babel/generator";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { wasmFolder } from "@hpcc-js/wasm";
import invariant from "invariant";
import path from "path";
import prettier from "prettier";
import run from "../HIR/Pipeline";
import { printFunction } from "../HIR/PrintHIR";
import visualizeHIRMermaid from "../HIR/VisualizeHIRMermaid";
import generateTestsFromFixtures from "./test-utils/generateTestsFromFixtures";

function wrapWithTripleBackticks(s: string, ext?: string) {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

wasmFolder(
  path.join(__dirname, "..", "..", "node_modules", "@hpcc-js", "wasm", "dist")
);

const Pragma_RE = /\/\/\s*@enable\((\w+)\)$/gm;

describe("React Forget (HIR version)", () => {
  generateTestsFromFixtures(
    path.join(__dirname, "fixtures", "hir"),
    (input, file) => {
      const matches = input.matchAll(Pragma_RE);

      for (const match of matches) {
        const [, key, value] = match;
        switch (key) {
          case "Pass":
            // do something with value;
            break;
          default:
            throw new Error(`unknown pragma: ${key}`);
        }
      }

      const ast = parser.parse(input, {
        sourceFilename: file,
        plugins: ["typescript", "jsx"],
      });
      let items: Array<[string, string, string]> = [];
      traverse(ast, {
        FunctionDeclaration: {
          enter(nodePath) {
            const { ir } = run(nodePath, {
              eliminateRedundantPhi: true,
              inferReferenceEffects: true,
              inferMutableRanges: true,
              inferReactiveScopeVariables: true,
              inferReactiveScopes: true,
              inferReactiveScopeDependencies: true,
              leaveSSA: false,
              codegen: false,
            });

            // Print the HIR before leaving SSA.
            const textHIR = printFunction(ir);
            const visualization = visualizeHIRMermaid(ir);

            const { ast } = run(nodePath, {
              eliminateRedundantPhi: true,
              inferReferenceEffects: true,
              inferMutableRanges: true,
              inferReactiveScopeVariables: true,
              inferReactiveScopes: true,
              inferReactiveScopeDependencies: true,
              leaveSSA: true,
              codegen: true,
            });

            invariant(
              ast !== null,
              "ast is null when codegen option is enabled"
            );
            const text = prettier.format(
              generate(ast).code.replace("\n\n", "\n"),
              {
                semi: true,
                parser: "babel-ts",
              }
            );
            items.push([textHIR, text, visualization]);
          },
        },
      });
      invariant(
        items.length > 0,
        "Visitor failed, check that the input has a function"
      );
      const outputs = items.map(([hir, text, visualization]) => {
        return `
## HIR

${wrapWithTripleBackticks(hir)}

### CFG

${wrapWithTripleBackticks(visualization, "mermaid")}

## Code

${wrapWithTripleBackticks(text, "javascript")}
        `.trim();
      });
      return `
## Input

${wrapWithTripleBackticks(input, "javascript")}

${outputs.join("\n")}
      `;
    }
  );
});
