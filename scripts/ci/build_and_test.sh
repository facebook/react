#!/bin/bash
set -ex

MODE=$1

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/../..

if [ "$MODE" = "dart_ddc" ]; then
  ${SCRIPT_DIR}/build_$MODE.sh
elif [[ $MODE = saucelabs* ]] ; then
  ${SCRIPT_DIR}/test_saucelabs.sh $MODE
elif [[ $MODE = browserstack* ]] ; then
  ${SCRIPT_DIR}/test_browserstack.sh $MODE
elif [ "$MODE" = "lint" ]; then
  ./node_modules/.bin/gulp static-checks
elif [ "$MODE" = "build_only" ]; then
  ${SCRIPT_DIR}/build_js.sh
  ${SCRIPT_DIR}/build_dart.sh
elif [ "$MODE" = "typescript_next" ]; then
   # Ignore complaints about unsatisfied peer deps
   npm install typescript@next || true
   ${SCRIPT_DIR}/build_js.sh
   # Run typings test using the GA release of TypeScript
   # This ensures that users aren't forced onto beta/nightly
   npm install typescript@1.8.9
   ./node_modules/.bin/gulp \!test.typings
elif [ "$MODE" = "payload" ]; then
  source ${SCRIPT_DIR}/env_dart.sh
  ./node_modules/.bin/gulp test.payload.dart/ci
  node --max-old-space-size=2000 ./node_modules/.bin/gulp test.payload.js/ci
else
  ${SCRIPT_DIR}/build_$MODE.sh
  ${SCRIPT_DIR}/test_$MODE.sh
fi
