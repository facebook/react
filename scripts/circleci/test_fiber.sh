#!/bin/bash

set -e

echo 'Testing in fiber mode...'
./scripts/fiber/record-tests --track-facts --max-workers 1
git --no-pager diff scripts/fiber
FIBER_TESTS_STATUS=$(git status --porcelain scripts/fiber)
test -z "$FIBER_TESTS_STATUS"
