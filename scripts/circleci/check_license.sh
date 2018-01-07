#!/bin/bash

set -e

# Make sure we don't introduce accidental references to PATENTS.
EXPECTED='scripts/circleci/check_license.sh'
ACTUAL=$(git grep -l PATENTS)

ANNOUNCEMENT=$(echo "PATENTS crept into some new files?")
DIFF=$(diff -u <(echo "$EXPECTED") <(echo "$ACTUAL") || true)
DATA=$ANNOUNCEMENT$DIFF

if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "$DATA"
  if [ "$REPORT_FORMATTER" = "junit" ]; then
    ./scripts/circleci/write_junit_report.sh "check_license" "$DATA" false
  fi
  exit 1
fi
