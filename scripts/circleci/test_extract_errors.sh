#!/bin/bash

set -e

./node_modules/.bin/gulp react:extract-errors

git --no-pager diff scripts/error-codes/codes.json
ERROR_CODE_TEST_STATUS=$(git status --porcelain scripts/error-codes/codes.json)

git --no-pager diff scripts/error-codes/warnings.txt
WARNINGS_TEST_STATUS=$(git status --porcelain scripts/error-codes/warnings.txt)

if [[ -z "$ERROR_CODE_TEST_STATUS" && -z "$WARNINGS_TEST_STATUS" ]]; then
  exit 0
else
  RED=$(echo -en '\033[00;31m')
  echo ${RED}"The error code and warnings files are out of date. Run gulp react:extract-errors and commit the result."
fi
