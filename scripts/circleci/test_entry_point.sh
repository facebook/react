#!/bin/bash

set -e

COMMANDS_TO_RUN=()

if [ $((1 % CIRCLE_NODE_TOTAL)) -eq "$CIRCLE_NODE_INDEX" ]; then
  COMMANDS_TO_RUN+=('./scripts/circleci/test_coverage.sh')
fi

if [ $((2 % CIRCLE_NODE_TOTAL)) -eq "$CIRCLE_NODE_INDEX" ]; then
  COMMANDS_TO_RUN+=('./scripts/circleci/test_fiber.sh')
fi

if [ $((3 % CIRCLE_NODE_TOTAL)) -eq "$CIRCLE_NODE_INDEX" ]; then
  COMMANDS_TO_RUN+=('node ./scripts/tasks/eslint')
fi

# These seem out of order but extract-errors must be run after jest.
if [ $((0 % CIRCLE_NODE_TOTAL)) -eq "$CIRCLE_NODE_INDEX" ]; then
  COMMANDS_TO_RUN+=('node ./scripts/prettier/index')
  COMMANDS_TO_RUN+=('node ./scripts/tasks/flow')
  COMMANDS_TO_RUN+=('node ./scripts/tasks/jest')
  COMMANDS_TO_RUN+=('./scripts/circleci/build.sh')
  COMMANDS_TO_RUN+=('./scripts/circleci/test_print_warnings.sh')
  COMMANDS_TO_RUN+=('./scripts/circleci/track_stats.sh')
  # COMMANDS_TO_RUN+=('./scripts/circleci/bench.sh')
fi

RETURN_CODES=()
FAILURE=0

printf "Node #%s (%s total). " "$CIRCLE_NODE_INDEX" "$CIRCLE_NODE_TOTAL"
if [ -n "${COMMANDS_TO_RUN[0]}" ]; then
  echo "Preparing to run commands:"
  for cmd in "${COMMANDS_TO_RUN[@]}"; do
    echo "- $cmd"
  done

  for cmd in "${COMMANDS_TO_RUN[@]}"; do
    echo
    echo "$ $cmd"
    set +e
    $cmd
    rc=$?
    set -e
    RETURN_CODES+=($rc)
    if [ $rc -ne 0 ]; then
      FAILURE=$rc
    fi
  done

  echo
  for i in "${!COMMANDS_TO_RUN[@]}"; do
    echo "Received return code ${RETURN_CODES[i]} from: ${COMMANDS_TO_RUN[i]}"
  done
  exit $FAILURE
else
  echo "No commands to run."
fi
