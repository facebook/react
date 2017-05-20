#!/bin/bash

set -e

echo 'Testing in server-render (HTML generation) mode...'
printf '\nmodule.exports.useCreateElement = false;\n' \
  >> src/renderers/dom/shared/ReactDOMFeatureFlags.js
./node_modules/.bin/grunt jest:normal
git checkout -- src/renderers/dom/shared/ReactDOMFeatureFlags.js
