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

./node_modules/.bin/gulp serve.js.prod&
serverPid=$!

trap killServer EXIT

# wait for server to come up!
sleep 10

# Let protractor use default browser unless one is specified.
OPTIONS="";
if [[ -n "$E2E_BROWSERS" ]]; then
  OPTIONS="--browsers=$E2E_BROWSERS";
fi

./node_modules/.bin/protractor protractor-js.conf.js $OPTIONS
./node_modules/.bin/protractor protractor-js.conf.js $OPTIONS --benchmark --dryrun
./node_modules/.bin/protractor dist/js/cjs/benchpress/test/firefox_extension/conf.js

