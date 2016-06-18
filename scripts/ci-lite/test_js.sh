#!/usr/bin/env bash

set -ex -o pipefail

if [[ ${TRAVIS} && ${CI_MODE} != "js" ]]; then
  exit 0;
fi


echo 'travis_fold:start:test.js'

# Setup environment
cd `dirname $0`
source ./env.sh
cd ../..


echo 'travis_fold:start:test.unit.tools'

# Run unit tests in tools
node ./dist/tools/tsc-watch/ tools runCmdsOnly

echo 'travis_fold:end:test.unit.tools'


echo 'travis_fold:start:test.unit.node'

# Run unit tests in node
node ./dist/tools/tsc-watch/ node runCmdsOnly

echo 'travis_fold:end:test.unit.node'


echo 'travis_fold:start:test.unit.localChrome'

# rebuild to revert files in @angular/compiler/test
# TODO(tbosch): remove this and teach karma to serve the right files
node dist/tools/@angular/tsc-wrapped/src/main -p modules/tsconfig.json

# Run unit tests in local chrome
if [[ ${TRAVIS} ]]; then
  sh -e /etc/init.d/xvfb start
fi

$(npm bin)/karma start ./karma-js.conf.js --single-run --browsers=${KARMA_JS_BROWSERS}
echo 'travis_fold:end:test.unit.localChrome'


echo 'travis_fold:end:test.js'
