#!/bin/bash

set -e

mkdir -p build/devtools

yarn workspace react-devtools pack --out ../../build/devtools/react-devtools.tgz

yarn workspace react-devtools-core pack --out ../../build/devtools/react-devtools-core.tgz

yarn workspace react-devtools-inline pack --out ../../build/devtools/react-devtools-inline.tgz

yarn workspace react-devtools-extensions build
mv packages/react-devtools-extensions/chrome/build/ReactDevTools.zip build/devtools/chrome-extension.zip
mv packages/react-devtools-extensions/firefox/build/ReactDevTools.zip build/devtools/firefox-extension.zip

# Compress all DevTools artifacts into a single tarball for easy download
cd build/devtools
tar -zcvf ../devtools.tgz .
