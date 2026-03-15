/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Debug HIR printer for the Rust port testing infrastructure.
 *
 * Prints a detailed representation of HIRFunction state, including all fields
 * of every identifier, instruction, terminal, and block. Also includes
 * outlined functions.
 *
 * Currently uses the existing printFunctionWithOutlined() from the compiler.
 * Will be enhanced to produce a more detailed format (every field, no elision)
 * as specified in the testing infrastructure plan.
 */

/**
 * Print a debug representation of an HIRFunction.
 * @param {Function} printFunctionWithOutlined - The printer from the compiler dist
 * @param {object} hirFunction - The HIRFunction to print
 * @returns {string} The debug representation
 */
export function debugPrintHIR(printFunctionWithOutlined, hirFunction) {
  return printFunctionWithOutlined(hirFunction);
}
