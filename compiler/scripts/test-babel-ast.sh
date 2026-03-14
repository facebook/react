#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FIXTURE_DIR="$REPO_ROOT/compiler/crates/react_compiler_ast/tests/fixtures"

# Regenerate fixtures if --update flag is passed
if [ "$1" = "--update" ]; then
  echo "Regenerating fixture JSONs..."
  rm -rf "$FIXTURE_DIR"
  mkdir -p "$FIXTURE_DIR"
  node "$REPO_ROOT/compiler/scripts/babel-ast-to-json.mjs" "$FIXTURE_DIR"
fi

# Run Rust round-trip test
echo "Running round-trip test..."
cd "$REPO_ROOT/compiler/crates"
FIXTURE_JSON_DIR="$FIXTURE_DIR" ~/.cargo/bin/cargo test -p react_compiler_ast --test round_trip -- --nocapture
