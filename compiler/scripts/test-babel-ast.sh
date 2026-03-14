#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

FIXTURE_SRC_DIR="$1"
if [ -z "$FIXTURE_SRC_DIR" ]; then
  # Default: the compiler's own test fixtures
  FIXTURE_SRC_DIR="$REPO_ROOT/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures"
fi

# Parse source files into JSON in a temp directory
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Parsing fixtures from $FIXTURE_SRC_DIR..."
node "$REPO_ROOT/compiler/scripts/babel-ast-to-json.mjs" "$FIXTURE_SRC_DIR" "$TMPDIR"

echo "Running round-trip test..."
cd "$REPO_ROOT/compiler/crates"
FIXTURE_JSON_DIR="$TMPDIR" ~/.cargo/bin/cargo test -p react_compiler_ast --test round_trip -- --nocapture
