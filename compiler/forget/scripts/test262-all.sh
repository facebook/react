#!/bin/bash
# There are over 50,000+ tests in test262, and the test harness only accepts arrays of filepaths
# not directories. This script iterates through all the test folders to break up the tests into
# chunks.

set -eo pipefail

for dir in test262/test/*;
do
  yarn run --silent test262 $dir/**/*.js;
done