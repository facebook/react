/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BabelPlugin from "./BabelPlugin";

declare global {
  var __DEV__: boolean | null | undefined;
}

// TODO: Replace the following exports with something like `export * as X from "./X";`
// so that we can make calls like `X.stringify` for better naming and DX.
export * from "./CompilerContext";
export { createCompilerFlags, parseCompilerFlags } from "./CompilerFlags";
export * from "./CompilerOptions";
export * from "./CompilerOutputs";
export * from "./Diagnostic";
export * from "./Logger";

export default BabelPlugin;
