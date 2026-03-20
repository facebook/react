// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Port of OutlineJsx from TypeScript.
//!
//! Outlines JSX expressions in callbacks into separate component functions.
//! This pass is conditional on `env.config.enable_jsx_outlining` (defaults to false).
//!
//! TODO: Full implementation. Currently a no-op stub since the feature is disabled
//! by default and no test fixtures exercise it with the Rust port.

use react_compiler_hir::environment::Environment;
use react_compiler_hir::HirFunction;

/// Outline JSX expressions in inner functions into separate outlined components.
///
/// Ported from TS `outlineJSX` in `Optimization/OutlineJsx.ts`.
/// Currently a no-op stub — the full implementation involves creating new
/// HIRFunctions, destructuring props, rewriting JSX instructions, and running
/// dead code elimination, which requires further infrastructure.
pub fn outline_jsx(_func: &mut HirFunction, _env: &mut Environment) {
    // TODO: implement full outlineJSX pass
}
