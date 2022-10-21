#!/usr/bin/env sh

# Copyright (c) Facebook, Inc. and its affiliates.

# Script to build the Forget plugin. We're storing it in a
# machine's local file system and symlinking to it from Playground,
# so that it's not cached by Vercel upon deployment.

## Build Forget plugin and link it so it can be used by playground
cd ../..
yarn
yarn build
yarn link

## Build ESLint for the browser and link it so it can be used by playground
cd packages/eslint-browser
yarn
yarn build
yarn link

## Configure the playground itself to use the above locally linked packages
cd ../playground
yarn link babel-plugin-react-forget
yarn link eslint-browser


# This is so that Vercel doesn't cache Forget across deployments, which
# makes sure we're using the latest Forget for Playground.
# Refer to the Yarn docs (https://classic.yarnpkg.com/en/docs/cli/link) for details.
