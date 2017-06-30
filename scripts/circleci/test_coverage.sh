#!/bin/bash

set -e

node ./scripts/tasks/jest --coverage
if [ -z $CI_PULL_REQUEST ]; then
  cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
fi
