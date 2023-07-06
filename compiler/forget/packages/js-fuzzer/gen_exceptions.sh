#!/bin/bash
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

APP_NAME=d8 node run.js -i $WEB_TESTS -o $OUTPUT -z -v -e -c chakra > chakra.log
APP_NAME=d8 node run.js -i $WEB_TESTS -o $OUTPUT -z -v -e -c v8 > v8.log
APP_NAME=d8 node run.js -i $WEB_TESTS -o $OUTPUT -z -v -e -c spidermonkey > spidermonkey.log
APP_NAME=d8 node run.js -i $WEB_TESTS -o $OUTPUT -z -v -e -c WebKit/JSTests > jstests.log
APP_NAME=d8 node run.js -i $WEB_TESTS -o $OUTPUT -z -v -e -c CrashTests > crashtests.log

node gen_exceptions.js v8.log spidermonkey.log chakra.log jstests.log crashtests.log
