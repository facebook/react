#!/bin/bash

set -e

# Make sure we don't introduce accidental references to PATENTS.
EXPECTED='docs/_posts/2014-10-28-react-v0.12.md
docs/_posts/2015-04-17-react-native-v0.4.md
scripts/circleci/check_license.sh'
ACTUAL=$(git grep -l PATENTS)

if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "PATENTS crept into some new files?"
  diff -u <(echo "$EXPECTED") <(echo "$ACTUAL") || true
  exit 1
fi
