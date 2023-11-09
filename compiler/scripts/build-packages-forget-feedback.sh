#!/bin/sh
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Script to build packages for Forget Feedback (eg when you need to add a new package to the
# testapp)

set -eo pipefail

cwd=`basename $(pwd)`

if [ $cwd != "react-forget" ]; then
  echo "Error: This script must be run from the top level react-forget directory. Exiting"
  exit 1
fi

# ----------------------- Build packages
yarn install --silent
rm -rf forget-feedback/dist
mkdir forget-feedback/dist

packages=("babel-plugin-react-forget" "eslint-plugin-react-forget" "react-forget-runtime")
for package in ${packages[@]}; do
  echo "Building" $package
  yarn workspace $package run build
done

echo "Copying artifacts to local forget-feedback directory..."
for package in ${packages[@]}; do
  for dir in packages/$package/; do
    if [ -d $dir/dist ]; then
      package_name=$(basename $dir)
      cp -R $dir/dist/. ./forget-feedback/dist/$package_name
    fi
  done
done
