#!/bin/bash

platform=`uname`
if [[ "$platform" == 'Linux' ]]; then
  `google-chrome --js-flags="--expose-gc"`
elif [[ "$platform" == 'Darwin' ]]; then
  `/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary \
      --enable-memory-info \
      --enable-precise-memory-info \
      --enable-memory-benchmarking \
      --js-flags="--expose-gc --allow-natives-syntax" \
      --disable-web-security \
      --remote-debugging-port=9222`
fi