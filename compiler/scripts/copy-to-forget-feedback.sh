#!/bin/sh
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -eo pipefail

if [ ! -d "../forget-feedback" ]; then
  echo "Error: forget-feedback repo not found, clone it from: https://github.com/facebookexternal/forget-feedback"
  exit 1
fi

cp -R ./forget-feedback/. ../forget-feedback