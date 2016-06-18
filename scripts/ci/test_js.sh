#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/../..

# Issue #945 Travis still uses Dartium, and hence needs the env setup.
# For local tests, when a developer doesn't have Dart, don't source env_dart.sh
if  ${SCRIPT_DIR}/env_dart.sh 2>&1 > /dev/null ; then
    source $SCRIPT_DIR/env_dart.sh
fi

./node_modules/.bin/gulp pre-test-checks
./node_modules/.bin/gulp test.js --browsers=${KARMA_JS_BROWSERS:-Chrome}
${SCRIPT_DIR}/test_e2e_js.sh
