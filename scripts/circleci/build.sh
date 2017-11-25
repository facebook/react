#!/bin/bash		
		
set -e		

yarn build --extract-errors
# Note: since we run the full build including extracting error codes,
# it is important that we *don't* reset the change to `scripts/error-codes/codes.json`.
# When production bundle tests run later, it needs to be available.
# See https://github.com/facebook/react/pull/11655.

# Do a sanity check on bundles
node ./scripts/rollup/validate/index

# Check that the standalone reconciler isn't borked
cd fixtures/reconciler
yarn
yarn test
