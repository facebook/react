#!/bin/bash

set -e -x

DART_CHANNEL=$1
VERSION=$2
ARCH=$3

AVAILABLE_DART_VERSION=$(curl "https://storage.googleapis.com/dart-archive/channels/${DART_CHANNEL}/release/${VERSION}/VERSION" | python -c \
    'import sys, json; print(json.loads(sys.stdin.read())["version"])')

echo Fetch Dart channel: ${DART_CHANNEL}

URL_PREFIX=https://storage.googleapis.com/dart-archive/channels/${DART_CHANNEL}/release/${VERSION}
DART_SDK_URL="$URL_PREFIX/sdk/dartsdk-$ARCH-release.zip"
DARTIUM_URL="$URL_PREFIX/dartium/dartium-$ARCH-release.zip"

download_and_unzip() {
  ZIPFILE=${1/*\//}
  curl -O -L $1 && unzip -q $ZIPFILE && rm $ZIPFILE
}

# TODO: do these downloads in parallel
download_and_unzip $DART_SDK_URL
download_and_unzip $DARTIUM_URL

echo Fetched new dart version $(<dart-sdk/version)

if [[ -n $DARTIUM_URL ]]; then
  mv dartium-* chromium
fi
