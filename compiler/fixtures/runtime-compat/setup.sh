#!/usr/bin/env bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -eo pipefail

HERE=$(pwd)

cd lib && yarn --silent link
cd $HERE/app-18 && yarn --silent link runtime-compat-lib
cd $HERE/app-19 && yarn --silent link runtime-compat-lib
