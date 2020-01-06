#!/bin/bash

set -e

mkdir -p build/devtools

cd packages/react-devtools
npm pack
mv ./react-devtools*.tgz ../../build/devtools/

cd ../react-devtools-core
npm pack
mv ./react-devtools-core*.tgz ../../build/devtools/

cd ../react-devtools-inline
npm pack
mv ./react-devtools-inline*.tgz ../../build/devtools/

cd ../react-devtools-extensions
yarn build
mv ./chrome/build/ReactDevTools.zip ../../build/devtools/chrome-extension.zip
mv ./firefox/build/ReactDevTools.zip ../../build/devtools/firefox-extension.zip

# Compress all DevTools artifacts into a single tarball for easy download
cd ../../build/devtools
tar -zcvf ../devtools.tgz .