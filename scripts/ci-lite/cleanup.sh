#!/usr/bin/env bash

set -ex -o pipefail

echo 'travis_fold:start:CLEANUP'

# Setup environment
cd `dirname $0`
source ./env.sh
cd ../..


if [[ ${TRAVIS} ]]; then

  case ${CI_MODE} in
    js)
      ;;
    saucelabs_required)
      ./scripts/sauce/sauce_connect_teardown.sh
      ;;
    browserstack_required)
      ./scripts/browserstack/teardown_tunnel.sh
      ;;
    saucelabs_optional)
      ./scripts/sauce/sauce_connect_teardown.sh
      ;;
    browserstack_optional)
      ./scripts/browserstack/teardown_tunnel.sh
      ;;
  esac
fi


echo 'travis_fold:start:cleanup.printLogs'
./scripts/ci/print-logs.sh
echo 'travis_fold:end:cleanup.printLogs'


echo 'travis_fold:end:CLEANUP'
