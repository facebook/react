#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Thin wrapper: builds the Rust native module, then delegates to the TS test script.
#
# Usage: bash compiler/scripts/test-rust-port.sh <pass> [<fixtures-path>]

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$1" ]; then
  echo "Usage: bash compiler/scripts/test-rust-port.sh <pass> [<fixtures-path>]"
  echo ""
  echo "Arguments:"
  echo "  <pass>           Name of the compiler pass to compare (e.g., HIR)"
  echo "  [<fixtures-path>] Fixture file or directory (default: compiler test fixtures)"
  exit 1
fi

# --- Build Rust native module ---
echo "Building Rust native module..."
if ! (cd "$REPO_ROOT/compiler/crates" && ~/.cargo/bin/cargo build -p react_compiler_napi 2>&1); then
  echo "ERROR: Failed to build Rust native module"
  exit 1
fi

# --- Symlink the built dylib as a .node file so Node can require() it ---
NATIVE_DIR="$REPO_ROOT/compiler/packages/babel-plugin-react-compiler-rust/native"
TARGET_DIR="$REPO_ROOT/compiler/target/debug"

# napi-rs produces a cdylib — on macOS it's .dylib, on Linux .so
if [ -f "$TARGET_DIR/libreact_compiler_napi.dylib" ]; then
  DYLIB="$TARGET_DIR/libreact_compiler_napi.dylib"
elif [ -f "$TARGET_DIR/libreact_compiler_napi.so" ]; then
  DYLIB="$TARGET_DIR/libreact_compiler_napi.so"
else
  echo "ERROR: Could not find built native module in $TARGET_DIR"
  exit 1
fi

# Node requires the .node extension to load as a native addon.
# Symlinks don't work because Node follows the symlink and sees the .dylib extension.
cp -f "$DYLIB" "$NATIVE_DIR/index.node"

# --- Delegate to TS script ---
exec npx tsx "$REPO_ROOT/compiler/scripts/test-rust-port.ts" "$@"
