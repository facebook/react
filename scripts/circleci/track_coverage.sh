#!/bin/bash

set -e

./node_modules/.bin/grunt jest:coverage
cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
