#!/usr/bin/env python3
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


"""
Helper script to execute fuzz tests in a single process.

Expects fuzz tests in workdir/output/dir-<dir number>/fuzz-XXX.js.
Expects the <dir number> as single parameter.
"""

import json
import os
import random
import re
import subprocess
import sys

BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOOZZIE = os.path.join(BASE_PATH, 'workdir', 'app_dir', 'v8_foozzie.py')
TEST_CASES = os.path.join(BASE_PATH, 'workdir', 'output')

assert os.path.exists(FOOZZIE)

# Output pattern from foozzie.py when it finds a failure.
FAILURE_RE = re.compile(
    r'# V8 correctness failure.'
    r'# V8 correctness configs: (?P<configs>.*).'
    r'# V8 correctness sources: (?P<source>.*).'
    r'# V8 correctness suppression:.*', re.S)

assert(len(sys.argv) > 1)
dir_number = int(sys.argv[1])
assert(dir_number >= 0)

test_dir = os.path.join(TEST_CASES, 'dir-%d' % dir_number)
assert os.path.exists(test_dir)

def failure_state(command, stdout):
  return dict(FAILURE_RE.search(stdout).groupdict(), command=command)

def random_seed():
  """Returns random, non-zero seed."""
  seed = 0
  while not seed:
    seed = random.SystemRandom().randint(-2147483648, 2147483647)
  return seed

def run(fuzz_file, flag_file):
  """Executes the differential-fuzzing harness foozzie with one fuzz test."""
  with open(flag_file) as f:
    flags = f.read().split(' ')
  args = [FOOZZIE, '--random-seed=%d' % random_seed()] + flags + [fuzz_file]
  cmd = ' '.join(args)
  try:
    output = subprocess.check_output(cmd, stderr=subprocess.PIPE, shell=True)
    return (cmd, output.decode('utf-8'))
  except Exception as e:
    return (cmd, e.output.decode('utf-8'))


def list_tests():
  """Iterates all fuzz tests and corresponding flags in the given base dir."""
  for f in os.listdir(test_dir):
    if f.startswith('fuzz'):
      n = int(re.match(r'fuzz-(\d+)\.js', f).group(1))
      ff = 'flags-%d.js' % n
      yield (os.path.join(test_dir, f), os.path.join(test_dir, ff))

# Some counters for the statistics.
count = 0
count_timeout = 0
count_crash = 0
count_failure = 0
failures = []

# Execute all tests in the given directory. Interpret foozzie's output and add
# it to the statistics.
for fuzz_file, flag_file in list_tests():
  cmd, output = run(fuzz_file, flag_file)
  count += 1
  if '# V8 correctness - pass' in output:
    continue
  if '# V8 correctness - T-I-M-E-O-U-T' in output:
    count_timeout += 1
    continue
  if '# V8 correctness - C-R-A-S-H' in output:
    count_crash += 1
    continue
  count_failure += 1
  failures.append(failure_state(cmd, output))

with open(os.path.join(test_dir, 'failures.json'), 'w') as f:
  json.dump(failures, f)

stats = {
  'total': count,
  'timeout': count_timeout,
  'crash': count_crash,
  'failure': count_failure,
}

with open(os.path.join(test_dir, 'stats.json'), 'w') as f:
  json.dump(stats, f)
