#!/bin/bash

set -e -x

# Setup environment
cd `dirname $0`
source ../ci-lite/env.sh


# This script basically follows the instructions to download an old version of Chromium: https://www.chromium.org/getting-involved/download-chromium
# 1) It retrieves the current stable version number from https://www.chromium.org/developers/calendar (via the https://omahaproxy.appspot.com/all file), e.g. 359700 for Chromium 48.
# 2) It checks the Travis cache for this specific version
# 3) If not available, it downloads and caches it, using the "decrement commit number" trick.

#Build version read from the OmahaProxy CSV Viewer at https://www.chromium.org/developers/calendar
#Let's use the following version of Chromium, and inform about availability of newer build from https://omahaproxy.appspot.com/all
#
# CHROMIUM_VERSION <<< this variable is now set via env.sh

PLATFORM="$(uname -s)"
case "$PLATFORM" in
  (Darwin)
    ARCHITECTURE=Mac
    DIST_FILE=chrome-mac.zip
    ;;
  (Linux)
    ARCHITECTURE=Linux_x64
    DIST_FILE=chrome-linux.zip
    ;;
  (*)
    echo Unsupported platform $PLATFORM.  Exiting ... >&2
    exit 3
    ;;
esac

TMP=$(curl -s "https://omahaproxy.appspot.com/all") || true
oldIFS="$IFS"
IFS='
'
IFS=${IFS:0:1}
lines=( $TMP )
IFS=','
for line in "${lines[@]}"
  do
    lineArray=($line);
    if [ "${lineArray[0]}" = "linux" ] && [ "${lineArray[1]}" = "stable" ] ; then
      LATEST_CHROMIUM_VERSION="${lineArray[7]}"
    fi
done
IFS="$oldIFS"

CHROMIUM_DIR=$HOME/.chrome/chromium
CHROMIUM_BIN=$CHROMIUM_DIR/chrome-linux/chrome
CHROMIUM_VERSION_FILE=$CHROMIUM_DIR/VERSION

EXISTING_VERSION=""
if [[ -f $CHROMIUM_VERSION_FILE && -x $CHROMIUM_BIN ]]; then
  EXISTING_VERSION=`cat $CHROMIUM_VERSION_FILE`
  echo Found cached Chromium version: ${EXISTING_VERSION}
fi

if [[ "$EXISTING_VERSION" != "$CHROMIUM_VERSION" ]]; then
  echo Downloading Chromium version: ${CHROMIUM_VERSION}
  rm -fR $CHROMIUM_DIR
  mkdir -p $CHROMIUM_DIR

  NEXT=$CHROMIUM_VERSION
  FILE="chrome-linux.zip"
  STATUS=404
  while [[ $STATUS == 404 && $NEXT -ge 0 ]]
  do
    echo Fetch Chromium version: ${NEXT}
    STATUS=$(curl "https://storage.googleapis.com/chromium-browser-snapshots/${ARCHITECTURE}/${NEXT}/${DIST_FILE}" -s -w %{http_code} --create-dirs -o $FILE) || true
    NEXT=$[$NEXT-1]
  done

  unzip $FILE -d $CHROMIUM_DIR
  rm $FILE
  echo $CHROMIUM_VERSION > $CHROMIUM_VERSION_FILE
fi

if [[ "$CHROMIUM_VERSION" != "$LATEST_CHROMIUM_VERSION" ]]; then
  echo "New version of Chromium available. Update install_chromium.sh with build number: ${LATEST_CHROMIUM_VERSION}"
fi

