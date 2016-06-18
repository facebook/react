#!/bin/bash
set -e

MODE=$1

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/../..

./scripts/sauce/sauce_connect_setup.sh
./scripts/sauce/sauce_connect_block.sh
./node_modules/.bin/gulp build.js.dev
./node_modules/.bin/gulp test.unit.js.sauce/ci --mode=$MODE
