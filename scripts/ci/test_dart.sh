#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
source $SCRIPT_DIR/env_dart.sh
cd $SCRIPT_DIR/../..

./node_modules/.bin/gulp test.dart --browsers=$KARMA_DART_BROWSERS
${SCRIPT_DIR}/test_server_dart.sh
${SCRIPT_DIR}/test_e2e_dart.sh
