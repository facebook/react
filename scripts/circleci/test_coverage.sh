#!/bin/bash

set -e

npm run test -- --coverage
if [ -z $CI_PULL_REQUEST ]; then
  cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
fi
