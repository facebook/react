#!/bin/bash		
		
set -e		

# On master, download the bundle sizes from last master build so that
# the size printed in the CI logs for master commits is accurate.
# We don't do it for pull requests because those are compared against
# the merge base by Dangerfile instead. See https://github.com/facebook/react/pull/12606.
if [ -z "$CI_PULL_REQUEST" ]; then
  curl -o scripts/rollup/results.json http://react.zpao.com/builds/master/latest/results.json
else
  # If build fails, cause danger to fail/abort too
  rm scripts/rollup/results.json
fi

yarn build --extract-errors
# Note: since we run the full build including extracting error codes,
# it is important that we *don't* reset the change to `scripts/error-codes/codes.json`.
# When production bundle tests run later, it needs to be available.
# See https://github.com/facebook/react/pull/11655.

# Do a sanity check on bundles
yarn lint-build
