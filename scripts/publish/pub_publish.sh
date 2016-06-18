#!/bin/bash

# Publishes Angular 2 packages to pub.

set -ex
shopt -s extglob

DRY_RUN=false
if [[ $1 == '--dry_run' ]]; then
  DRY_RUN=true
fi;

ROOT_DIR=$(cd $(dirname $0)/../..; pwd)
cd $ROOT_DIR

gulp clean
gulp build/packages.dart
gulp build/pubspec.dart
gulp build/analyze.dart

PKG_DIR=$ROOT_DIR/dist/pub
rm -fr $PKG_DIR

function publishModule {
  NAME=$1
  PUBLISH_DIR=$PKG_DIR/$NAME

  scripts/publish/pub_prepare.sh $NAME

  if [[ "$DRY_RUN" == "false" ]]; then
    (cd $PUBLISH_DIR && pub publish -f)
  fi;
}

publishModule angular2
publishModule benchpress
publishModule benchmarks
publishModule angular2_testing
