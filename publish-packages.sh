#!/usr/bin/env bash

set -ex

cd `dirname $0`

VERSION=$1

if [[ "${VERSION}" == "" ]]
then
  echo "Version number required"
  exit 1
fi

./build.sh

echo "====== RENAMING 0.0.0-PLACEHOLDER to 2.0.0-rc.${VERSION} ======"
find ./dist/packages-dist/ -type f -name package.json -print0 | xargs -0 sed -i '' "s/0\\.0\\.0-PLACEHOLDER/2.0.0-rc.${VERSION}/g"
find ./dist/packages-dist/ -type f -name "*umd.js" -print0 | xargs -0 sed -i '' "s/0\\.0\\.0-PLACEHOLDER/2.0.0-rc.${VERSION}/g"

for PACKAGE in \
  core \
  compiler \
  compiler-cli \
  common \
  http \
  platform-browser \
  platform-server \
  router \
  router-deprecated \
  upgrade
do
  DESTDIR=./dist/packages-dist/${PACKAGE}
  echo "====== PUBLISHING: ${DESTDIR} ====="
  npm publish ${DESTDIR} --access public
done
