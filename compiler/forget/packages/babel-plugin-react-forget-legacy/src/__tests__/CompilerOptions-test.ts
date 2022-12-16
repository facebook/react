/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import { PluginOptions } from "@babel/core";
import {
  createCompilerOptions,
  parseCompilerOptions,
} from "../CompilerOptions";
import { OutputKind } from "../CompilerOutputs";
import { noopLogger } from "../Logger";
import { PassName } from "../Pass";

describe("CompilerOptions", () => {
  function validateCompilerOptionThrows(opt: PluginOptions) {
    expect(() => {
      parseCompilerOptions(opt);
    }).toThrowError();
  }

  it("fails invalid compiler options", () => {
    validateCompilerOptionThrows(false);
    validateCompilerOptionThrows({
      outputKinds: ["Zuck"],
    });
    validateCompilerOptionThrows({
      stopPass: ["Zuck"],
    });
    validateCompilerOptionThrows({
      optIn: "Zuck",
    });
    validateCompilerOptionThrows({
      logger: null,
    });
    validateCompilerOptionThrows({
      flags: { "-zuck": true },
    });
    validateCompilerOptionThrows(false);
  });

  it("passes valid compiler options", () => {
    expect(parseCompilerOptions({})).toEqual(createCompilerOptions());
    expect(parseCompilerOptions(undefined)).toEqual(createCompilerOptions());
    const fullInput = {
      outputKinds: [OutputKind.JS, OutputKind.LIR],
      flags: {
        addFreeze: true,
        condCache: true,
        guardReads: true,
        guardHooks: true,
        localMutationThroughFreeVars: false,
        bailOnMultipleReturns: true,
        bailOnCapitalizedFunctionCalls: true,
        bailOnNestedComponents: true,
        bailOnUseRef: true,
        singleReturnShortcut: true,
      },
      optIn: true,
      stopPass: PassName.JSGen,
      logger: noopLogger,
      allowedCapitalizedUserFunctions: new Set(),
      postCodegenValidator: null,
    };
    expect(parseCompilerOptions(fullInput)).toEqual(fullInput);
  });

  it("ignores extra top level keys", () => {
    expect(
      parseCompilerOptions({
        unknownExtraKey: "what?",
      })
    ).toEqual(createCompilerOptions());
  });
});
