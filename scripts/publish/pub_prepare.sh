#!/bin/bash

# This script prepares build artifacts for upload to pub.
#
# Usage:
#
# scripts/publish/pub_prepare.sh PACKAGE_NAME

set -ex
shopt -s extglob

NAME=$1
ROOT_DIR=$(cd $(dirname $0)/../..; pwd)
cd $ROOT_DIR

PKG_DIR=$ROOT_DIR/dist/pub
FILES='!(e2e_test|pubspec.lock)'

PUBLISH_DIR=$PKG_DIR/$NAME
rm -fr $PUBLISH_DIR
mkdir -p $PUBLISH_DIR

cp -RP $ROOT_DIR/dist/dart/$NAME/$FILES $PUBLISH_DIR

node scripts/publish/pubspec_cleaner.js --pubspec-file=$PUBLISH_DIR/pubspec.yaml
