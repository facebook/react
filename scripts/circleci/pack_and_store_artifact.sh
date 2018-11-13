#!/bin/bash

set -e

# NPM pack all modules to ensure we archive the correct set of files
for dir in ./build/node_modules/* ; do
  npm pack "$dir"
done

# Wrap everything in a single zip file for easy download by the publish script
tar -zcvf ./node_modules.tgz ./*.tgz