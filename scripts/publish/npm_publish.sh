#!/bin/bash
set -ex
shopt -s extglob

ROOT_DIR=$(cd $(dirname $0)/../..; pwd)
cd $ROOT_DIR

gulp clean
# benchpress.bundle and bundles.js will implicitly build everything we need
# TODO: revert to normal gulp once we fix https://github.com/angular/angular/issues/5229
#       gulp benchpress.bundle bundles.js
node --max-old-space-size=1900 ./node_modules/.bin/gulp benchpress.bundle bundles.js

NPM_DIR=$ROOT_DIR/dist/npm
rm -fr $NPM_DIR

scripts/publish/npm_prepare.sh angular2
scripts/publish/npm_prepare.sh benchpress

npm publish $NPM_DIR/angular2
npm publish $NPM_DIR/benchpress

npm logout
