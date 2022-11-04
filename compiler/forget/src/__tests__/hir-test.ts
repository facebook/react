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
import { lower } from "../HIR/BuildHIR";
import codegen from "../HIR/Codegen";
import { HIRFunction } from "../HIR/HIR";
import { Environment } from "../HIR/HIRBuilder";
import inferReferenceEffects from "../HIR/InferReferenceEffects";
import printHIR from "../HIR/PrintHIR";
import buildSSA from "../HIR/SSAify";
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
      let items: Array<[string, string]> = [];
      traverse(ast, {
        FunctionDeclaration: {
          enter(nodePath) {
            const env: Environment = new Environment();
            const ir: HIRFunction = lower(nodePath, env);
            buildSSA(ir, env);
            inferReferenceEffects(ir);
            // const lifetimeGraph = buildDefUseGraph(ir);
            const textHIR = printHIR(ir.body);
            // const textLifetimeGraph = printGraph(lifetimeGraph);
            // const graphvizFile = path.join(
            //   __dirname,
            //   "fixtures",
            //   "hir-svg",
            //   file + ".svg"
            // );
            // if (input.indexOf("@Out DefUseGraph") !== -1) {
            //   graphviz.layout(textLifetimeGraph, "svg", "dot").then((svg) => {
            //     writeFileSync(graphvizFile, svg);
            //   });
            // } else if (existsSync(graphvizFile)) {
            //   unlinkSync(graphvizFile);
            // }

            const ast = codegen(ir);
            const text = prettier.format(
              generate(ast).code.replace("\n\n", "\n"),
              {
                semi: true,
                parser: "babel-ts",
              }
            );
            items.push([textHIR, text]);
          },
        },
      });
      invariant(
        items.length > 0,
        "Visitor failed, check that the input has a function"
      );
      const outputs = items.map(([hir, text]) => {
        return `
## HIR

${wrapWithTripleBackticks(hir)}

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
