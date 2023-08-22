#!/usr/bin/env bash
set -eo pipefail

TMPFILE=$(mktemp /tmp/forget-test262-XXXXX)

yarn workspace babel-plugin-react-forget run --silent test262-harness \
  --threads=10 \
  --preprocessor=scripts/test262-preprocessor.js \
  --reporter=json \
  --reporter-keys=file,result \
  '../../test262/test/**/*.js' >> $TMPFILE

jq '. | group_by(.result.pass,.result.message) | map({"pass": .[0].result.pass, "message": .[0].result.message, "count": length}) | tostring' $TMPFILE