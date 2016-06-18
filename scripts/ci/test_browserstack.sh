#!/bin/bash
set -e

MODE=$1

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/../..

./scripts/browserstack/start_tunnel.sh
./scripts/browserstack/waitfor_tunnel.sh
./node_modules/.bin/gulp build.js.dev
./node_modules/.bin/gulp test.unit.js.browserstack/ci --mode=$MODE
