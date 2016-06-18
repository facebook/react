#!/usr/bin/env bash

set -ex -o pipefail

cd `dirname $0`
cd ../..

export NODE_PATH=${NODE_PATH}:$(pwd)/dist-packages/

DEST_DIR=./dist/trees-shaking-test

rm -rf ${DEST_DIR}

for PACKAGE in \
  core \
  compiler \
  common \
  platform-browser \
  platform-server \
  http \
  router \
  upgrade
do
  echo "=======    Tree-shaking TEST: ${SRCDIR} ====="
  TEST_DIR=${DEST_DIR}/${PACKAGE}
  TEST_ENTRY_POINT=${TEST_DIR}/test.js
  mkdir -p ${TEST_DIR}
  cp ./tools/tree-shaking-test/rollup.config.js ${TEST_DIR}/
  echo "import * as x from '@angular/${PACKAGE}'" > ${TEST_ENTRY_POINT}
  (
    cd ${TEST_DIR}
    $(npm bin)/rollup --config rollup.config.js --output ${PACKAGE}.bundle.js
  )

done
