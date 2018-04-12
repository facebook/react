#!/bin/bash

set -e

# Make sure we don't introduce accidental @providesModule annotations.
EXPECTED='packages/react-native-renderer/src/ReactNativeTypes.js
packages/shared/ReactTypes.js
scripts/rollup/wrappers.js'
ACTUAL=$(git grep -l @providesModule -- './*.js' ':!scripts/rollup/shims/*.js')

# Colors
red=$'\e[1;31m'
end=$'\e[0m'

if [ "$EXPECTED" != "$ACTUAL" ]; then
  printf "%s\n" "${red}ERROR: @providesModule crept into some new files?${end}"
  diff -u <(echo "$EXPECTED") <(echo "$ACTUAL") || true
  exit 1
fi
