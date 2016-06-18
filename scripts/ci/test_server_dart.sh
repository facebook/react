#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
cd $SCRIPT_DIR/../..

./node_modules/.bin/webdriver-manager update
./node_modules/.bin/webdriver-manager start&
webdriverServerPid=$!
ps -ef | grep webdriver-manager

# Serving pre-compiled dart JS takes an extra 15m.
# So we do this only for post-commit testing.
# Pull requests test with Dartium and pub serve
# TODO(jeffbcross): restore conditional dart2js/pubserve #4316
#if [ "${TRAVIS_PULL_REQUEST}" = "false" ]; then
  ./node_modules/.bin/gulp build/pubbuild.dart
  ./node_modules/.bin/gulp serve.js.dart2js&
  serverPid=$!
#else
#  ./node_modules/.bin/gulp serve.dart&
#  serverPid=$!
#fi

function killAllServers () {
  kill $serverPid
  pkill -P $webdriverServerPid
}

trap killAllServers EXIT

# wait for server to come up!
sleep 3

./node_modules/.bin/gulp test.transpiler.unittest
./node_modules/.bin/gulp test.server.dart --browsers=$KARMA_DART_BROWSERS
