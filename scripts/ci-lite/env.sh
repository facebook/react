#!/usr/bin/env bash

set -e -o pipefail


NODE_VERSION=5.4.1
NPM_VERSION=3.5.3
CHROMIUM_VERSION=386251 # Chrome 50 linux stable, see https://www.chromium.org/developers/calendar
SAUCE_CONNECT_VERSION=4.3.11



if [[ ${TRAVIS} ]]; then
  # Token for tsd to increase github rate limit
  # See https://github.com/DefinitelyTyped/tsd#tsdrc
  # This does not use http://docs.travis-ci.com/user/environment-variables/#Secure-Variables
  # because those are not visible for pull requests, and those should also be reliable.
  # This SSO token belongs to github account angular-github-ratelimit-token which has no access
  # (password is in Valentine)
  TSDRC='{"token":"ef474500309daea53d5991b3079159a29520a40b"}'


  case ${CI_MODE} in
    js)
      KARMA_JS_BROWSERS=ChromeNoSandbox
      ;;
    saucelabs_required)
      KARMA_JS_BROWSERS=`node -e "console.log(require('/home/travis/build/angular/angular/browser-providers.conf').sauceAliases.CI_REQUIRED.join(','))"`
      ;;
    browserstack_required)
      KARMA_JS_BROWSERS=`node -e "console.log(require('/home/travis/build/angular/angular/browser-providers.conf').browserstackAliases.CI_REQUIRED.join(','))"`
      ;;
    saucelabs_optional)
      KARMA_JS_BROWSERS=`node -e "console.log(require('/home/travis/build/angular/angular/browser-providers.conf').sauceAliases.CI_OPTIONAL.join(','))"`
      ;;
    browserstack_optional)
      KARMA_JS_BROWSERS=`node -e "console.log(require('/home/travis/build/angular/angular/browser-providers.conf').browserstackAliases.CI_OPTIONAL.join(','))"`
      ;;
  esac
else
  KARMA_JS_BROWSERS=Chrome
fi



# GLOBALS

# Append dist/all to the NODE_PATH so that cjs module resolver finds find the packages that use
# absolute module ids (e.g. @angular/core)
export NODE_PATH=${NODE_PATH}:$(pwd)/../../dist/all:$(pwd)/../../dist/tools
export LOGS_DIR=/tmp/angular-build/logs

if [[ ${TRAVIS} ]]; then
  # used by xvfb that is used by Chromium
  export DISPLAY=:99.0

  # Use newer verison of GCC to that is required to compile native npm modules for Node v4+ on Ubuntu Precise
  # more info: https://docs.travis-ci.com/user/languages/javascript-with-nodejs#Node.js-v4-(or-io.js-v3)-compiler-requirements
  export CXX=g++-4.8

  # Used by karma and karma-chrome-launcher
  export SAUCE_USERNAME=angular-ci
  export SAUCE_ACCESS_KEY=9b988f434ff8-fbca-8aa4-4ae3-35442987
  export BROWSER_STACK_USERNAME=angularteam1
  export BROWSER_STACK_ACCESS_KEY=BWCd4SynLzdDcv8xtzsB
  export CHROME_BIN=${HOME}/.chrome/chromium/chrome-linux/chrome
fi

