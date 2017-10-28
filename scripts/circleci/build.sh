#!/bin/bash		
		
set -e		

yarn build --extract-errors
git checkout -- scripts/error-codes/codes.json

# Check that the standalone reconciler isn't borked
cd fixtures/reconciler
yarn
yarn test
