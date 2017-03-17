#!/bin/bash

set -e

./node_modules/.bin/gulp react:extract-errors
git checkout -- scripts/error-codes/codes.json

WARNINGS=$(node scripts/error-codes/print-warnings.js)
echo "$WARNINGS"
test ! -z "$WARNINGS"
