#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:TEST'

# Setup environment
cd `dirname $0`
source ./env.sh
cd ../..

./scripts/ci-lite/test_js.sh
./scripts/ci-lite/test_e2e.sh
./scripts/ci-lite/test_saucelabs.sh
./scripts/ci-lite/test_browserstack.sh

echo 'travis_fold:end:test-browser'

echo 'travis_fold:end:TEST'
