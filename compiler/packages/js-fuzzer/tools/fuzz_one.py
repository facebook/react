#!/usr/bin/env python3
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


"""
Helper script to execute a single-processed fuzzing session.

Creates fuzz tests in workdir/output/dir-<dir number>/fuzz-XXX.js.
Expects the <dir number> as single parameter.
"""

import os
import subprocess
import sys
import time

BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_PATH, 'workdir', 'app_dir')
FUZZ_EXE = os.path.join(BASE_PATH, 'workdir', 'fuzzer', 'ochang_js_fuzzer')
INPUT_DIR = os.path.join(BASE_PATH, 'workdir', 'input')
TEST_CASES = os.path.join(BASE_PATH, 'workdir', 'output')

COUNT = 64
FUZZ = ('FUZZ_MODE=foozzie APP_NAME=d8 APP_DIR=%s %s -o %%s -n %s -i %s > %%s'
        % (APP_DIR, FUZZ_EXE, COUNT, INPUT_DIR))

assert(len(sys.argv) > 1)
dir_number = int(sys.argv[1])
assert(dir_number >= 0)

path = os.path.join(TEST_CASES, 'dir-%d' % dir_number)
assert not os.path.exists(path), 'Need fresh workdir for fuzzing'
os.makedirs(path)

start = time.time()
subprocess.check_call(
    FUZZ % (path, os.path.join(path, 'out.log')), shell=True)
duration = int(time.time() - start)

with open(os.path.join(path, 'duration.log'), 'w') as f:
  f.write(str(duration))
