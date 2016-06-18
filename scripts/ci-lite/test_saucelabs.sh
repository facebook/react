#!/usr/bin/env bash

set -ex -o pipefail

if [[ ${TRAVIS} && ${CI_MODE} != "saucelabs_required" && ${CI_MODE} != "saucelabs_optional" ]]; then
  exit 0;
fi


echo 'travis_fold:start:test_saucelabs'

# Setup environment
cd `dirname $0`
source ./env.sh
cd ../..


./scripts/sauce/sauce_connect_block.sh
SAUCE_ACCESS_KEY=`echo $SAUCE_ACCESS_KEY | rev`
$(npm bin)/karma start ./karma-js.conf.js --single-run --browsers=${KARMA_JS_BROWSERS}

echo 'travis_fold:end:test_saucelabs'
