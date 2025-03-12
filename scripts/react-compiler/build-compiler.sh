#!/usr/bin/env bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

echo "Building babel-plugin-react-compiler..."
yarn --cwd compiler install --frozen-lockfile
yarn --cwd compiler workspace babel-plugin-react-compiler build --dts
