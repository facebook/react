#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
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
  # WARNING: the build/pubbuild.dart task is assumed to have been run before, in test_server_dart.sh
  ./node_modules/.bin/gulp serve.js.dart2js&
  serverPid=$!
#else
#  ./node_modules/.bin/gulp serve.dart&
#  serverPid=$!
#fi

trap killServer EXIT

# wait for server to come up!
sleep 10

./node_modules/.bin/protractor protractor-dart2js.conf.js --browsers=${E2E_BROWSERS:-Dartium}
./node_modules/.bin/protractor protractor-dart2js.conf.js --benchmark --dryrun --browsers=${E2E_BROWSERS:-Dartium}
