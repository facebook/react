/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export { lower } from "./BuildHIR";
export { HIRFunction, ReactiveFunction } from "./HIR";
export { Environment } from "./HIRBuilder";
export { mergeConsecutiveBlocks } from "./MergeConsecutiveBlocks";
export { printFunction } from "./PrintHIR";
