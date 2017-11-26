#!/bin/bash

set -e

yarn test --coverage --runInBand
if [ -z $CI_PULL_REQUEST ]; then
  cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
fi

# TODO: should we also track prod code coverage somehow?
# yarn test-prod --coverage
