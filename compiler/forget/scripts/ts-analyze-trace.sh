#!/usr/bin/env bash
# Generates a TypeScript performance trace in a tmp folder, then runs the analyze-trace npm module
# to identify any hotspots that might cause slow compilation
# See https://github.com/microsoft/typescript-analyze-trace for CLI args

set -eo pipefail

tmp_dir=$(mktemp -d -t forget-XXXXXXXXXX)
tsc -p ./tsconfig.json --generateTrace $tmp_dir --incremental false && npx @typescript/analyze-trace $tmp_dir "$@"
