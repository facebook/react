#!/bin/bash

set -e

if [ -z $CI_PULL_REQUEST ] && [ -n "$BUILD_SERVER_ENDPOINT" ]; then
  curl \
    -F "react=@build/react.js" \
    -F "react.min=@build/react.min.js" \
    -F "react-dom=@build/react-dom.js" \
    -F "react-dom.min=@build/react-dom.min.js" \
    -F "react-dom-server=@build/react-dom-server.js" \
    -F "react-dom-server.min=@build/react-dom-server.min.js" \
    -F "npm-react=@build/packages/react.tgz" \
    -F "npm-react-dom=@build/packages/react-dom.tgz" \
    -F "commit=$CIRCLE_SHA1" \
    -F "date=`git log --format='%ct' -1`" \
    -F "pull_request=false" \
    -F "token=$BUILD_SERVER_TOKEN" \
    -F "branch=$CIRCLE_BRANCH" \
    $BUILD_SERVER_ENDPOINT
fi
