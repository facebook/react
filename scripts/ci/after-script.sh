#!/bin/bash
set -e -o pipefail

echo '*******************'
echo '** AFTER_SCRIPT **'
echo '*******************'

if [ "$MODE" = "saucelabs" ]; then
  ./scripts/sauce/sauce_connect_teardown.sh
fi
if [ "$MODE" = "browserstack" ]; then
  ./scripts/browserstack/teardown_tunnel.sh
fi


echo '---------------------'
echo '-- WAIT FOR OTHERS --'
echo '---------------------'

python ./scripts/ci/travis_after_all.py
. .to_export_back

echo BUILD_LEADER=$BUILD_LEADER
echo BUILD_AGGREGATE_STATUS=$BUILD_AGGREGATE_STATUS

if [ "$BUILD_LEADER" = "YES" ]; then
  if [ "$BUILD_AGGREGATE_STATUS" = "others_succeeded" ]; then
    ./scripts/ci/presubmit-queue-success.sh
  else
    echo "ERROR: Some Failed, not submitting"
  fi
else
  echo "ERROR: Other builds have not finished, not submitting"
fi
