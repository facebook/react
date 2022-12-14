/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HIR, HIRFunction } from "./HIR";
import printHIR, { printFunction } from "./PrintHIR";

let ENABLED: boolean = false;

export function toggleLogging(enabled: boolean) {
  ENABLED = enabled;
}

export function logHIR(step: string, ir: HIR): void {
  log(() => `${step}:\n${printHIR(ir)}`);
}

export function logHIRFunction(step: string, fn: HIRFunction): void {
  log(() => `${step}:\n${printFunction(fn)}`);
}

export function log(fn: () => string) {
  if (ENABLED) {
    const message = fn();
    process.stdout.write(message.trim() + "\n\n");
  }
}
