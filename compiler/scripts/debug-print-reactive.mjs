/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Debug ReactiveFunction printer for the Rust port testing infrastructure.
 *
 * Prints a detailed representation of ReactiveFunction state, including all
 * fields of every scope, instruction, and terminal.
 *
 * Currently uses the existing printReactiveFunctionWithOutlined() from the compiler.
 * Will be enhanced to produce a more detailed format as specified in the plan.
 */

/**
 * Print a debug representation of a ReactiveFunction.
 * @param {Function} printReactiveFunctionWithOutlined - The printer from the compiler dist
 * @param {object} reactiveFunction - The ReactiveFunction to print
 * @returns {string} The debug representation
 */
export function debugPrintReactive(
  printReactiveFunctionWithOutlined,
  reactiveFunction
) {
  return printReactiveFunctionWithOutlined(reactiveFunction);
}
