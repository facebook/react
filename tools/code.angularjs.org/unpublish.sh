#!/bin/bash

# Script for removing specified release dir from code.angularjs.org.

echo "################################################"
echo "## Remove a version from code.angular.js.org ###"
echo "################################################"

ARG_DEFS=(
  "--action=(prepare|publish)"
  "--version-number=([0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?)"
)

function init {
  TMP_DIR=$(resolveDir ../../tmp)
  REPO_DIR=$TMP_DIR/code.angularjs.org
  echo "code tmp $TMP_DIR"
}

function prepare {
  echo "-- Cloning code.angularjs.org"
  git clone git@github.com:angular/code.angularjs.org.git $REPO_DIR

  #
  # Remove the files from the repo
  #
  echo "-- Removing $VERSION_NUMBER from code.angularjs.org"
  cd $REPO_DIR
  if [ -d "$VERSION_NUMBER" ]; then
    git rm -r $VERSION_NUMBER
    echo "-- Committing removal to code.angularjs.org"
    git commit -m "removing v$VERSION_NUMBER"
  else
    echo "-- Version: $VERSION_NUMBER does not exist in code.angularjs.org!"
  fi
}

function publish {
  cd $REPO_DIR

  echo "-- Pushing code.angularjs.org to github"
  git push origin master
}

source $(dirname $0)/../utils.inc
