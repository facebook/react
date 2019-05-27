#!/bin/bash

set -e

# Compress build directory into a single tarball for easy download
tar -zcvf ./build.tgz ./build

# NPM pack all modules to ensure we archive the correct set of files
cd ./build/node_modules
for dir in ./* ; do
  npm pack "$dir"
done

# Compress packed modules into a single tarball for easy download by the publish script
tar -zcvf ../../node_modules.tgz ./*.tgz
