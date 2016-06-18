#!/bin/bash
set -e -o pipefail

if [[ -z $ENV_SET ]]; then
  export ENV_SET=1

  # Map DART_SDK and DARTSDK to each other if only one is specified.
  #
  # TODO(chirayu): Remove this legacy DARTSDK variable support.  Check with Misko
  # to see if he's using it on this Mac.
  if [[ -z "$DART_SDK" ]]; then
    : "${DARTSDK:=$DART_SDK}"
  else
    : "${DART_SDK:=$DARTSDK}"
  fi

  unset DART
  PLATFORM="$(uname -s)"

  case "$PLATFORM" in
    (Darwin)
      path=$(readlink ${BASH_SOURCE[0]}||echo './scripts/env.sh')
      export NGDART_SCRIPT_DIR=$(dirname $path)
      ;;
    (Linux)
      export NGDART_SCRIPT_DIR=$(dirname $(readlink -f ${BASH_SOURCE[0]}))
      ;;
    (*)
      echo Unsupported platform $PLATFORM.  Exiting ... >&2
      exit 3
      ;;
  esac

  export NGDART_BASE_DIR=$(dirname $NGDART_SCRIPT_DIR)

  # Try to find the SDK alongside the dart command first.
  if [[ -z "$DART_SDK" ]]; then
    DART=$(which dart) || true
    if [[ -x "$DART" ]]; then
      DART_SDK="${DART/dart-sdk\/*/dart-sdk}"
      if [[ ! -e "$DART_SDK" ]]; then
        unset DART DART_SDK
      fi
    fi
  fi
  # Fallback: Assume it's alongside the current directory (e.g. Travis).
  if [[ -z "$DART_SDK" ]]; then
    DART_SDK="$(pwd)/dart-sdk"
  fi

  : "${DART:=$DART_SDK/bin/dart}"

  if [[ ! -x "$DART" ]]; then
    echo Unable to locate the dart binary / SDK. Exiting >&2
    exit 3
  fi

  if [[ -z "$DARTIUM" ]]; then
    dartiumRoot="$DART_SDK/../chromium"
    if [[ -e "$dartiumRoot" ]]; then
      case "$PLATFORM" in
        (Linux) export DARTIUM="$dartiumRoot/chrome" ;;
        (Darwin) export DARTIUM="$dartiumRoot/Chromium.app/Contents/MacOS/Chromium" ;;
        (*) echo Unsupported platform $PLATFORM.  Exiting ... >&2 ; exit 3 ;;
      esac
    fi
  fi

  export DART_SDK_LIB_SEARCH_PATH="$DART_SDK"
  export DART_SDK
  export DARTSDK
  export DART
  export PUB=${PUB:-"$DART_SDK/bin/pub"}
  if [ -z "$PUB_CACHE" ]; then
    export PUB_CACHE=$DART_SDK/pub-cache
  fi
  export DARTANALYZER=${DARTANALYZER:-"$DART_SDK/bin/dartanalyzer"}
  export DARTDOC=${DARTDOC:-"$DART_SDK/bin/dartdoc"}
  export DART_DOCGEN=${DART_DOCGEN:-"$DART_SDK/bin/docgen"}
  export DART_VM_OPTIONS="--old_gen_heap_size=2048"
  export DARTIUM_BIN=${DARTIUM_BIN:-"$DARTIUM"}
  export CHROME_BIN=${CHROME_BIN:-"google-chrome"}
  export PATH=$PATH:$DART_SDK/bin

  echo '*********'
  echo '** ENV **'
  echo '*********'
  echo DART_SDK=$DART_SDK
  echo DART_SDK_LIB_SEARCH_PATH=$DART_SDK_LIB_SEARCH_PATH
  echo DART=$DART
  echo PUB=$PUB
  echo DARTANALYZER=$DARTANALYZER
  echo DARTDOC=$DARTDOC
  echo DART_DOCGEN=$DART_DOCGEN
  echo DARTIUM_BIN=$DARTIUM_BIN
  echo CHROME_BIN=$CHROME_BIN
  echo PATH=$PATH
  echo NGDART_BASE_DIR=$NGDART_BASE_DIR
  echo NGDART_SCRIPT_DIR=$NGDART_SCRIPT_DIR

fi
