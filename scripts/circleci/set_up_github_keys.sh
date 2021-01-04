#!/bin/bash

set -e

if [ -n "$GITHUB_TOKEN" ]; then

  GH_PAGES_DIR=$(pwd)/../react-gh-pages
  echo "machine github.com login reactjs-bot password $GITHUB_TOKEN" >~/.netrc
  git config --global user.name "Circle CI"
  git config --global user.email "circle@reactjs.org"

fi
