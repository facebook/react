#!/usr/bin/env bash

set -e -o pipefail

if [ $# -eq 0 ]
  then
    echo "Angular test runner. (No platform specified)"
    echo
    echo "./test.sh [node|browser|tools]"
    echo
else
  cd `dirname $0`
  export NODE_PATH=$NODE_PATH:$(pwd)/dist/all:$(pwd)/dist/tools
  $(npm bin)/tsc -p tools
  node dist/tools/tsc-watch/ $1 watch
fi


