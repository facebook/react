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
if [[ -n "$1" ]]; then
  yarn build:$1
  if [[ "$1" != "edge" ]]; then
    mv ./$1/build/ReactDevTools.zip ../../build/devtools/$1-extension.zip
  fi
else
  yarn build
  mv ./chrome/build/ReactDevTools.zip ../../build/devtools/chrome-extension.zip
  mv ./firefox/build/ReactDevTools.zip ../../build/devtools/firefox-extension.zip
fi

# Compress all DevTools artifacts into a single tarball for easy download
cd ../../build/devtools
tar -zcvf ../devtools.tgz .
