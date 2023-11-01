#!/bin/sh
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Note: This should be run from the top level react-forget directory!

set -eo pipefail

if [ ! -d "../forget-feedback" ]; then
  echo "Error: forget-feedback repo not found, clone it from: https://github.com/facebookexternal/forget-feedback. Exiting"
  exit 1
fi

if [ ! -z "$(cd ../forget-feedback && git status --porcelain)" ]; then
  echo "Error: forget-feedback repo has pending changes. Exiting"
  exit 1
fi

prev_hash=$(cat ../forget-feedback/HASH)

echo "Ensuring clean repo..."
rm -rf ../forget-feedback/*

echo "Copying files..."
cd forget-feedback && cp -R `ls -A | grep -v "node_modules" | grep -v "todo.md"` ../../forget-feedback

cd ../

tmpfile=$(mktemp /tmp/forget-feedback-XXXXXX)
echo "Build Forget" >> $tmpfile
echo "\n\n" >> $tmpfile
git log --format=oneline "$prev_hash"..$(git rev-parse HEAD) >> $tmpfile
echo "\n\n" >> $tmpfile
git log --format="%an <%ae>" "$prev_hash"..$(git rev-parse HEAD) | sort -u | while read -r a; do echo Co-authored-by: "$a" >> $tmpfile; done

git rev-parse HEAD > ../forget-feedback/HASH

cd ../forget-feedback

echo "Creating commit in forget-feedback..."
git add -A && git commit -F $tmpfile --quiet
git log -1 --pretty=%B