#!/bin/bash

set -e

ALL_FILES=`find packages -name '*.js' | grep -v umd/ | grep -v __tests__ | grep -v __mocks__`
COUNT_ALL_FILES=`echo "$ALL_FILES" | wc -l`
FLOW_ANNOTATED_FILES=`grep '@flow' $ALL_FILES | perl -pe 's/:.+//'`
COUNT_FLOW_ANNOTATED_FILES=`echo "$FLOW_ANNOTATED_FILES" | wc -l`
INLINED_FLOW_ANNOTATED_FILES=`echo "$FLOW_ANNOTATED_FILES" | perl -pe 's/\n/ /'`
node scripts/facts-tracker/index.js "flow-files" "$INLINED_FLOW_ANNOTATED_FILES $COUNT_FLOW_ANNOTATED_FILES/$COUNT_ALL_FILES"
