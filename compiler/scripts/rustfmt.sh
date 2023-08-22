#!/usr/bin/env bash
set -eo pipefail

# Executes rustfmt using a nightly build of the compiler
# NOTE: this command must exactly match the Rust Lint command in .github/workflows/rust.yml
rustup toolchain list | grep -q nightly-2023-08-01 || (echo "Expected Rust version missing, try running: 'rustup toolchain install nightly-2023-08-01'" && exit 1)
grep -r --include "*.rs" --files-without-match "@generated" crates | xargs rustup run nightly-2023-08-01 rustfmt --config="skip_children=true" "$@"