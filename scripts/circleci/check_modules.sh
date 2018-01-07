#!/bin/bash

set -e

# Make sure we don't introduce accidental @providesModule annotations.
EXPECTED='scripts/rollup/wrappers.js'
ACTUAL=$(git grep -l @providesModule -- './*.js' ':!scripts/rollup/shims/*.js')

# Colors
red=$'\e[1;31m'
end=$'\e[0m'

ANNOUNCEMENT=$(printf "%s\n" "${red}ERROR: @providesModule crept into some new files?${end}")
DIFF=$(diff -u <(echo "$EXPECTED") <(echo "$ACTUAL") || true)
DATA=$ANNOUNCEMENT$DIFF

if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "$DATA"
  if [ "$REPORT_FORMATTER" = "junit" ]; then
    ./scripts/circleci/write_junit_report.sh "check_modules" "$DATA" false
  fi
  exit 1
fi
