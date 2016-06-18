#!/usr/bin/env bash
set -ex -o pipefail

# These ones can be `npm link`ed for fast development
LINKABLE_PKGS=(
  $(pwd)/dist/packages-dist/{common,core,compiler,compiler-cli,http,router,router-deprecated,upgrade,platform-{browser,browser-dynamic,server}}
)

TMPDIR=${TMPDIR:-/tmp/angular-build/}
readonly TMP=$TMPDIR/typings-test.$(date +%s)
mkdir -p $TMP
cp -R -v tools/typings-test/* $TMP

# run in subshell to avoid polluting cwd
(
  cd $TMP
  # create package.json so that npm install doesn't pollute any parent node_modules's directory
  npm init --yes
  npm install ${LINKABLE_PKGS[*]}
  npm install @types/es6-promise @types/es6-collections @types/jasmine rxjs@5.0.0-beta.6
  npm install typescript@1.8.10
  $(npm bin)/tsc --version
  $(npm bin)/tsc -p tsconfig.json
)
