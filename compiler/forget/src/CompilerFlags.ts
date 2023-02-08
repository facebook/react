/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type CompilerFlags = {
  /**
   * Enable to make Forget only compile functions containing the 'use forget' directive.
   */
  enableOnlyOnUseForgetDirective: boolean;
};

export const defaultFlags: CompilerFlags = {
  enableOnlyOnUseForgetDirective: false,
} as const;

export function parseCompilerFlags(obj: unknown): CompilerFlags {
  if (obj == null || typeof obj !== "object") {
    return defaultFlags;
  }
  const invalidFlags: Array<string> = [];
  let parsedFlags: Partial<CompilerFlags> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (isCompilerFlag(key)) {
      parsedFlags[key] = value;
    } else {
      invalidFlags.push(key);
    }
  }
  if (invalidFlags.length > 0) {
    console.error(`Unexpected React Forget compiler flags: ${invalidFlags}`);
  }
  return { ...defaultFlags, ...parsedFlags };
}

function isCompilerFlag(s: string): s is keyof typeof defaultFlags {
  return Object.prototype.hasOwnProperty.call(defaultFlags, s);
}
