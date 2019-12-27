#!/bin/bash

set -e

yarn test --coverage --maxWorkers=2
if [ -z "$CI_PULL_REQUEST" ]; then
  ./node_modules/.bin/coveralls < ./coverage/lcov.info
fi

# TODO: should we also track prod code coverage somehow?
# yarn test-prod --coverage
