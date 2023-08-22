#!/bin/bash
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

OS="linux"
OS_LABEL="Linux"
SUFFIX=""
if [[ -n "$1" && $1 == "win" ]]; then
  OS="win"
  OS_LABEL="Windows"
  SUFFIX=".exe"
elif [[ -n "$1" && $1 == "macos" ]]; then
  OS="macos"
  OS_LABEL="MacOS"
fi

echo "Building and packaging for $OS_LABEL..."
(set -x; $DIR/node_modules/.bin/pkg -t node10-$OS-x64 $DIR)

rm -rf $DIR/output > /dev/null 2>&1 || true
rm $DIR/output.zip > /dev/null 2>&1 || true

mkdir $DIR/output
cd $DIR/output
ln -s ../db db
ln -s ../ochang_js_fuzzer$SUFFIX run$SUFFIX
ln -s ../foozzie_launcher.py foozzie_launcher.py
echo "Creating $DIR/output.zip"
(set -x; zip -r $DIR/output.zip * > /dev/null)
