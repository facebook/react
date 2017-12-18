#!/bin/bash		
		
set -e		

# Update the local size measurements to the master version
# so that the size diff printed at the end of the build is
# accurate.
merge_base_hash=`git merge-base HEAD master`
timestamp=`git log --format='%ct' -1 $merge_base_hash`
json_url=http://react.zpao.com/builds/master/$timestamp-$merge_base_hash/results.json
echo Downloading original build sizes from: $json_url
echo $CIRCLE_COMPARE_URL
curl -o scripts/rollup/results.json $json_url

yarn build --extract-errors
# Note: since we run the full build including extracting error codes,
# it is important that we *don't* reset the change to `scripts/error-codes/codes.json`.
# When production bundle tests run later, it needs to be available.
# See https://github.com/facebook/react/pull/11655.

# Do a sanity check on bundles
yarn lint-build
