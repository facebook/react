#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
source $SCRIPT_DIR/env_dart.sh
cd $SCRIPT_DIR/../..

./node_modules/.bin/webdriver-manager update

function killServer () {
  kill $serverPid
}

# Serving pre-compiled dart JS takes an extra 15m.
# So we do this only for post-commit testing.
# Pull requests test with Dartium and pub serve
# TODO(jeffbcross): restore conditional dart2js/pubserve #4316
#if [ "${TRAVIS_PULL_REQUEST}" = "false" ]; then
  ./node_modules/.bin/gulp build/pubbuild.dart
  ./node_modules/.bin/gulp serve.js.prod serve.js.dart2js&
  serverPid=$!
#else
#  ./node_modules/.bin/gulp serve.js.prod serve.dart&
#  serverPid=$!
#fi

trap killServer EXIT

# wait for server to come up!
sleep 10

./node_modules/.bin/protractor protractor-js.conf.js --browsers=$PERF_BROWSERS --benchmark
./node_modules/.bin/protractor protractor-dart2js.conf.js --browsers=$PERF_BROWSERS --benchmark
