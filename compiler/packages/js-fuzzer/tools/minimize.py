#!/usr/bin/env python3
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


"""
Helper script to forge a command line for clusterfuzz' minimizer for
each failure found during a fuzzing session with workbench.py.

Expects the path to the minimizer tools, e.g. something like:
path/to/src/python/bot/minimizer
"""

import json
from multiprocessing import cpu_count
import os
import sys

PROCESSES = cpu_count()
BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(BASE_PATH, 'out.js')
FAILURES_JSON_PATH = os.path.join(
    BASE_PATH, 'workdir', 'output', 'failures.json')

assert len(sys.argv) > 1, 'Need to specify minimizer path.'
minimizer_path = sys.argv[1]

def getcmd(command):
  parts = command.split(' ')
  prefix = command[:-(len(parts[-1]) + 1)]
  return ('python %s/run.py -t%d -mjs -o %s "%s" %s' %
          (minimizer_path, PROCESSES, OUT_PATH, prefix, parts[-1]))

with open(FAILURES_JSON_PATH) as f:
  failures = json.load(f)

for failure in failures:
  print('*********************************************************')
  print('Source: ' + failure['source'])
  print('Command:')
  print(failure['command'])
  print('Minimize:')
  print(getcmd(failure['command']))
