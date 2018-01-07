#!/bin/bash

set -e

# $1: build step name
# $2: data that will be part of the junit report if the build step has failed
# $3: boolean that indicates whether the build step is successful
node ./scripts/tasks/junit "$1" "$2" "$3"
