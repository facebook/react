#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# --- Arguments ---
PASS="$1"
FIXTURE_DIR="$2"

if [ -z "$PASS" ]; then
  echo "Usage: bash compiler/scripts/test-rust-port.sh <pass> [<dir>]"
  echo ""
  echo "Arguments:"
  echo "  <pass>  Name of the compiler pass to run up to (e.g., HIR, SSA, InferTypes)"
  echo "  [<dir>] Fixture root directory (default: compiler test fixtures)"
  exit 1
fi

if [ -z "$FIXTURE_DIR" ]; then
  FIXTURE_DIR="$REPO_ROOT/compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures"
fi

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
RESET='\033[0m'

# --- Temp directory with cleanup ---
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# --- Build Rust binary ---
echo "Building Rust binary..."
RUST_BINARY="$REPO_ROOT/compiler/target/debug/test-rust-port"
if ! (cd "$REPO_ROOT/compiler/crates" && ~/.cargo/bin/cargo build --bin test-rust-port 2>"$TMPDIR/cargo-build.log"); then
  echo -e "${RED}ERROR: Failed to build Rust binary${RESET}"
  echo "Cargo output:"
  cat "$TMPDIR/cargo-build.log"
  exit 1
fi

if [ ! -x "$RUST_BINARY" ]; then
  echo -e "${RED}ERROR: Rust binary not found at $RUST_BINARY${RESET}"
  exit 1
fi

# --- Parse fixtures into AST JSON + Scope JSON ---
echo "Parsing fixtures from $FIXTURE_DIR..."
AST_DIR="$TMPDIR/ast"
mkdir -p "$AST_DIR"
node "$REPO_ROOT/compiler/scripts/babel-ast-to-json.mjs" "$FIXTURE_DIR" "$AST_DIR"

# --- Discover fixtures ---
FIXTURES=()
while IFS= read -r -d '' file; do
  # Get relative path from fixture dir
  rel="${file#$FIXTURE_DIR/}"
  # Skip if parse failed (check for .parse-error marker)
  if [ -f "$AST_DIR/$rel.parse-error" ]; then
    continue
  fi
  # Skip if AST JSON was not generated
  if [ ! -f "$AST_DIR/$rel.json" ]; then
    continue
  fi
  FIXTURES+=("$rel")
done < <(find "$FIXTURE_DIR" -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \) -print0 | sort -z)

TOTAL=${#FIXTURES[@]}
if [ "$TOTAL" -eq 0 ]; then
  echo "No fixtures found in $FIXTURE_DIR"
  exit 1
fi

echo -e "Testing ${BOLD}$TOTAL${RESET} fixtures up to pass: ${BOLD}$PASS${RESET}"
echo ""

# --- Run tests ---
PASSED=0
FAILED=0
RUST_PANICKED=0
OUTPUT_MISMATCH=0
FAILURES=()

TS_BINARY="$REPO_ROOT/compiler/scripts/ts-compile-fixture.ts"

for fixture in "${FIXTURES[@]}"; do
  fixture_path="$FIXTURE_DIR/$fixture"
  ast_json="$AST_DIR/$fixture.json"
  scope_json="$AST_DIR/$fixture.scope.json"

  # Run TS binary
  ts_output_file="$TMPDIR/ts-output"
  ts_exit=0
  npx tsx "$TS_BINARY" "$PASS" "$fixture_path" > "$ts_output_file" 2>&1 || ts_exit=$?

  # Run Rust binary
  rust_output_file="$TMPDIR/rust-output"
  rust_exit=0
  "$RUST_BINARY" "$PASS" "$ast_json" "$scope_json" > "$rust_output_file" 2>&1 || rust_exit=$?

  # Compare results
  if [ "$rust_exit" -ne 0 ]; then
    # Rust panicked or errored (non-zero exit)
    FAILED=$((FAILED + 1))
    RUST_PANICKED=$((RUST_PANICKED + 1))
    if [ ${#FAILURES[@]} -lt 5 ]; then
      FAILURES+=("PANIC:$fixture")
    fi
  elif [ "$ts_exit" -ne 0 ] && [ "$rust_exit" -eq 0 ]; then
    # TS failed but Rust succeeded: mismatch
    FAILED=$((FAILED + 1))
    OUTPUT_MISMATCH=$((OUTPUT_MISMATCH + 1))
    if [ ${#FAILURES[@]} -lt 5 ]; then
      FAILURES+=("MISMATCH:$fixture")
    fi
  elif diff -q "$ts_output_file" "$rust_output_file" > /dev/null 2>&1; then
    # Both succeeded (or both failed) and outputs match
    PASSED=$((PASSED + 1))
  else
    # Outputs differ
    FAILED=$((FAILED + 1))
    OUTPUT_MISMATCH=$((OUTPUT_MISMATCH + 1))
    if [ ${#FAILURES[@]} -lt 5 ]; then
      FAILURES+=("DIFF:$fixture")
    fi
  fi
done

# --- Show first 5 failures with diffs ---
for failure_info in "${FAILURES[@]}"; do
  kind="${failure_info%%:*}"
  fixture="${failure_info#*:}"
  fixture_path="$FIXTURE_DIR/$fixture"
  ast_json="$AST_DIR/$fixture.json"
  scope_json="$AST_DIR/$fixture.scope.json"

  echo -e "${RED}FAIL${RESET} $fixture"

  if [ "$kind" = "PANIC" ]; then
    echo "  Rust binary exited with non-zero status (panic/todo!)"
    # Re-run to capture output for display
    rust_err="$TMPDIR/rust-err-display"
    "$RUST_BINARY" "$PASS" "$ast_json" "$scope_json" > "$rust_err" 2>&1 || true
    echo "  Rust stderr:"
    head -20 "$rust_err" | sed 's/^/    /'
    echo ""
  elif [ "$kind" = "MISMATCH" ]; then
    echo "  TS binary failed but Rust binary succeeded (or vice versa)"
    echo ""
  elif [ "$kind" = "DIFF" ]; then
    # Re-run to capture outputs for diff display
    ts_out="$TMPDIR/ts-diff-display"
    rust_out="$TMPDIR/rust-diff-display"
    npx tsx "$TS_BINARY" "$PASS" "$fixture_path" > "$ts_out" 2>&1 || true
    "$RUST_BINARY" "$PASS" "$ast_json" "$scope_json" > "$rust_out" 2>&1 || true
    diff -u --label "TypeScript" --label "Rust" "$ts_out" "$rust_out" | head -50 | while IFS= read -r line; do
      case "$line" in
        ---*) echo -e "${RED}$line${RESET}" ;;
        +++*) echo -e "${GREEN}$line${RESET}" ;;
        @@*)  echo -e "${YELLOW}$line${RESET}" ;;
        -*)   echo -e "${RED}$line${RESET}" ;;
        +*)   echo -e "${GREEN}$line${RESET}" ;;
        *)    echo "$line" ;;
      esac
    done
    echo ""
  fi
done

# --- Summary ---
echo "---"
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}Results: $PASSED passed, $FAILED failed ($TOTAL total)${RESET}"
else
  echo -e "${RED}Results: $PASSED passed, $FAILED failed ($TOTAL total)${RESET}"
  echo -e "  $RUST_PANICKED rust panicked (todo!), $OUTPUT_MISMATCH output mismatch"
fi

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
