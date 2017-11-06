#!/bin/bash		
		
set -e		

yarn build --extract-errors
git checkout -- scripts/error-codes/codes.json

# Do a sanity check on bundles
node ./scripts/rollup/validate/index

# Check that the standalone reconciler isn't borked
cd fixtures/reconciler
yarn
yarn test
