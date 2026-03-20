// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

//! Reactive scope passes for the React Compiler.
//!
//! Converts the HIR CFG into a tree-structured `ReactiveFunction` and runs
//! scope-related transformation passes (pruning, merging, renaming, etc.).
//!
//! Corresponds to `src/ReactiveScopes/` in the TypeScript compiler.

mod build_reactive_function;
pub mod print_reactive_function;

pub use build_reactive_function::build_reactive_function;
pub use print_reactive_function::debug_reactive_function;
