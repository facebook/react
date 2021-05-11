#!/usr/bin/env sh

# Copyright (c) Facebook, Inc. and its affiliates.

# Script to build the Forget plugin. We're storing it in a
# machine's local file system and symlinking to it from Playground,
# so that it's not cached by Vercel upon deployment.

cd ../..

# Build Forget plugin from source.
yarn
yarn build

# Create a symlink in the global folder that links to Forget.
yarn link

cd packages/playground
# Create a symlink from the globally-installed Forget to Playground's
# node_modules folder.
yarn link babel-plugin-react-forget

# This is so that Vercel doesn't cache Forget across deployments, which
# makes sure we're using the latest Forget for Playground.
# Refer to the Yarn docs (https://classic.yarnpkg.com/en/docs/cli/link) for details.
