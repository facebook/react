/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { default as BabelPlugin } from "./Babel/BabelPlugin";
export { compile, run } from "./CompilerPipeline";
export { printHIR } from "./HIR";
export { printReactiveFunction } from "./ReactiveScopes";

declare global {
  var __DEV__: boolean | null | undefined;
}
