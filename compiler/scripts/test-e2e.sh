#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# End-to-end test runner for all compiler frontends (Babel, SWC, OXC).
#
# Usage: bash compiler/scripts/test-e2e.sh [fixtures-path] [--variant babel|swc|oxc] [--limit N] [--no-color]

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

exec npx tsx "$REPO_ROOT/compiler/scripts/test-e2e.ts" "$@"
