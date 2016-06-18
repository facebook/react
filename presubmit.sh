#!/usr/bin/env bash

set -e -o pipefail

cd `dirname $0`
gulp lint
gulp check-format
export NODE_PATH=$NODE_PATH:$(pwd)/dist/all
./build.sh;
$(npm bin)/tsc -p tools
$(npm bin)/tsc -p tools/compiler-cli/src
# $(npm bin)/tsc -p tools/compiler-cli/test
node dist/tools/tsc-watch/ node

## rebuild since codegen has overwritten some files.
$(npm bin)/tsc -p modules/tsconfig.json
$(npm bin)/karma start karma-js.conf.js --single-run
