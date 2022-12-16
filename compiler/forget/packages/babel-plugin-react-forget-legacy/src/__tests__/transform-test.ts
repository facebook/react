/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import path from "path";
import { getMostRecentCompilerContext } from "../CompilerContext";
import {
  CompilerFlags,
  createCompilerFlags,
  parseCompilerFlags,
} from "../CompilerFlags";
import {
  isOutputKind,
  isSyntacticallyValidJS,
  OutputKind,
  stringifyCompilerOutputs,
} from "../CompilerOutputs";
import { printDiagnostic } from "../Diagnostic";
import { createArrayLogger } from "../Logger";
import { PassName } from "../Pass";
import generateTestsFromFixtures from "./test-utils/generateTestsFromFixtures";
import validateNoUseBeforeDefine from "./test-utils/validateNoUseBeforeDefine";
import * as TestDriver from "./TestDriver";

enum DebugPragma {
  Out = "Out",
  Transform = "Transform",
  Flags = "Flags",
  Stop = "Stop",
}

const DEBUG_PRAGMA_PATTERN = new RegExp(
  `\/\/\\s*@(${Object.keys(DebugPragma).join("|")})\\s+(.+)\\s+`,
  "g"
);

function wrapWithTripleBackticks(s: string, ext?: string) {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

describe("React Forget", () => {
  generateTestsFromFixtures(
    path.join(__dirname, "fixtures", "transform"),
    (input, file) => {
      const matches = input.matchAll(DEBUG_PRAGMA_PATTERN);

      const compileOptions = {
        blockScopingTransform: false,
      };
      let flags: CompilerFlags = createCompilerFlags();
      let outputKinds: OutputKind[] = [];
      let stopPass: PassName = PassName.Validator;
      for (const match of matches) {
        const [, key, value] = match;
        switch (key as DebugPragma) {
          case DebugPragma.Out:
            for (const outputKind of value.split(/\s*,\s*/)) {
              if (isOutputKind(outputKind)) {
                outputKinds.push(outputKind);
              } else {
                throw new Error(
                  `Unsupported value for @${key} pragma: '${outputKind}'`
                );
              }
            }
            break;
          case DebugPragma.Transform:
            switch (value) {
              case "block-scoping": {
                compileOptions.blockScopingTransform = true;
                break;
              }
              default:
                throw new Error(
                  `Unsupported value for @Transform pragma: '${value}'`
                );
            }
            break;
          case DebugPragma.Stop: {
            const keyValue = value as keyof typeof PassName;
            if (!PassName[keyValue]) {
              throw new Error(
                `Unsupported value for @${key} pragma: '${value}'`
              );
            }
            stopPass = PassName[keyValue];
            break;
          }
          case DebugPragma.Flags: {
            const jsonValue = JSON.parse(value);
            flags = parseCompilerFlags(jsonValue);
            break;
          }
          default:
            throw new Error(`Unsupported pragma: @${key}`);
        }
      }
      outputKinds.push(OutputKind.JS);
      // De-duplicate outputKinds.
      outputKinds = [...new Set(outputKinds)];

      // Cache real console.log
      let realConsoleLog = console.log;

      const logs: string[] = [];
      let compilerOutputs = null;
      let error = null;
      try {
        compilerOutputs = TestDriver.compile(
          input,
          {
            outputKinds,
            stopPass,
            flags,
            logger: createArrayLogger(logs),
            allowedCapitalizedUserFunctions: new Set([
              "ReactForgetSecretInternals",
            ]),
            postCodegenValidator: validateNoUseBeforeDefine,
          },
          compileOptions
        );
      } catch (_error) {
        error = _error;
      }
      const context = getMostRecentCompilerContext();
      const logOutput =
        logs.length === 0
          ? "(Empty)"
          : `${wrapWithTripleBackticks(logs.join("\n\n"))}`;

      const expectError = file.startsWith("error.");
      const hasError = error !== null;
      if (hasError !== expectError) {
        if (expectError) {
          throw new Error(
            `Expected Forget to error on '${file}' but it did not.\nLogs:\n${logOutput}`
          );
        } else {
          console.error(error);
          throw new Error(`Expected '${file}' to succeed but it errored`);
        }
      }

      const hasBailout = context.bailouts.length > 0;
      const expectBailout = file.startsWith("bailout.");
      if (!hasError && hasBailout !== expectBailout) {
        if (expectBailout) {
          throw new Error(
            `Expected Forget to bail out on '${file}' but it did not.\nLogs:\n${logOutput}`
          );
        } else {
          console.error(context.bailouts);
          throw new Error(`Expected '${file}' to succeed but bailed out`);
        }
      }

      const outputs: string[] = [];
      if (compilerOutputs !== null) {
        const prettyOutputs = stringifyCompilerOutputs(compilerOutputs);

        outputKinds.forEach((outputKind) => {
          const prettyOutput = prettyOutputs[outputKind];
          const isJS = isSyntacticallyValidJS(outputKind);

          outputs.push(
            `## ${outputKind}\n\n${wrapWithTripleBackticks(
              prettyOutput ?? "",
              isJS ? "js" : ""
            )}`
          );
        });
      }
      if (error !== null) {
        outputs.push(error.message);
      }

      const diagnosticsOutput =
        context.diagnostics.length === 0
          ? "(Empty)"
          : `${wrapWithTripleBackticks(
              context.diagnostics
                .map((diag) => printDiagnostic(diag))
                .join("\n\n")
            )}`;

      const bailoutsOutput =
        context.bailouts.length === 0
          ? "(Empty)"
          : `${wrapWithTripleBackticks(
              context.bailouts
                .map((bail) => `[${bail.code}] ${bail.reason}`)
                .join("\n")
            )}`;

      // Recover real console.log.
      console.log = realConsoleLog;

      return `${outputs.join("\n\n")}

## Console

${logOutput}

## Diagnostics

${diagnosticsOutput}

## Bailouts

${bailoutsOutput}
`;
    }
  );
});
