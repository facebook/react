#!/bin/bash
set -ex

echo =============================================================================
# go to project dir
SCRIPT_DIR=$(dirname $0)
source $SCRIPT_DIR/env_dart.sh
cd $SCRIPT_DIR/../..

./node_modules/.bin/gulp build.js.cjs build.dart benchpress.bundle

pub install
