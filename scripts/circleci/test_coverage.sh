#!/bin/bash

TEMPORARY_LOG_FILE="coveralls-errors.log"

. ./scripts/circleci/common.sh

set -e

yarn test --coverage --maxWorkers=2 --testResultsProcessor=${JEST_PROCESSOR}

set +e

if [ -z "$CI_PULL_REQUEST" ]; then
  cat ./coverage/lcov.info | process_command "coveralls" "$REPORT_FORMATTER" "$TEMPORARY_LOG_FILE" \
  ./node_modules/.bin/coveralls
  RES=$?
  if [ $RES -ne 0 ]; then
    exit $RES
  fi
fi

set -e

# TODO: should we also track prod code coverage somehow?
# yarn test-prod --coverage
