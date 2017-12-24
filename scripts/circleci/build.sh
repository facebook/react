#!/bin/bash		
		
set -e		

# Update the local size measurements to the master version
# so that the size diff printed at the end of the build is
# accurate.
# curl -o scripts/rollup/results.json http://react.zpao.com/builds/master/latest/results.json

yarn build --extract-errors
# Note: since we run the full build including extracting error codes,
# it is important that we *don't* reset the change to `scripts/error-codes/codes.json`.
# When production bundle tests run later, it needs to be available.
# See https://github.com/facebook/react/pull/11655.

# Do a sanity check on bundles
yarn lint-build
