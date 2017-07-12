#!/bin/bash

set -e

echo 'Testing with customAttributes flag set to false...'
printf '\nmodule.exports.allowCustomAttributes = false;\n' \
  >> src/renderers/dom/shared/ReactDOMFeatureFlags.js
node ./scripts/tasks/jest
git checkout -- src/renderers/dom/shared/ReactDOMFeatureFlags.js
