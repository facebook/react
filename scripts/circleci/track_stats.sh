#!/bin/bash

set -e

ALL_FILES=`find packages -name '*.js' | grep -v umd/ | grep -v __tests__ | grep -v __mocks__`
COUNT_ALL_FILES=`echo "$ALL_FILES" | wc -l`
COUNT_WITH_FLOW=`grep '@flow' $ALL_FILES | perl -pe 's/:.+//' | wc -l`
node scripts/facts-tracker/index.js "flow-files" "$COUNT_WITH_FLOW/$COUNT_ALL_FILES"
