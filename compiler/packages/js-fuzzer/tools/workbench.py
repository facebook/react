#!/usr/bin/env python3
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


"""
Tool to execute multiprocessed fuzzing and testing sessions.

Expects a single parameter with the number of sessions.

Regularly updates a stats.json and failures.json during executions. E.g.
stay up-to-date with:
cat workdir/output/stats.json | python -m json.tool
"""

# TODO(machenbach): This is currently tailored for differential fuzzing
# with foozzie. It could be generalized, but that'd require duplicating
# clusterfuzz' stack analysis to some degree. E.g. understanding asan
# or DCHECK failures.

from __future__ import print_function

import json
import math
from multiprocessing import Pool, cpu_count
import os
import random
import subprocess
import sys

PROCESSES = cpu_count()
BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_CASES = os.path.join(BASE_PATH, 'workdir', 'output')
FUZZ_ONE = os.path.join(BASE_PATH, 'tools', 'fuzz_one.py')
RUN_ONE = os.path.join(BASE_PATH, 'tools', 'run_one.py')

os.chdir(BASE_PATH)

if os.path.exists(TEST_CASES):
  if not os.path.isdir(TEST_CASES) or os.listdir(TEST_CASES):
    sys.exit("'output' must be an empty directory")
else:
  os.mkdir(TEST_CASES)

# Use ~40000 for 24 hours of fuzzing on a modern work station.
RUNS = 8
if len(sys.argv) > 1:
  RUNS = int(sys.argv[1])

def run(n):
  """Multiprocessed function that executes a single fuzz session and
  afterwards executes all fuzz tests and collects the statistics.

  Args:
    n: Subdirectory index of this run.
  """
  subprocess.check_call([sys.executable, FUZZ_ONE, str(n)])
  subprocess.check_call([sys.executable, RUN_ONE, str(n)])
  test_dir = os.path.join(TEST_CASES, 'dir-%d' % n)
  with open(os.path.join(test_dir, 'stats.json')) as f:
    stats = json.load(f)
  with open(os.path.join(test_dir, 'failures.json')) as f:
    failures = json.load(f)
  return (stats, failures)


class Stats(object):
  def __init__(self):
    self.total = 0
    self.crash = 0
    self.timeout = 0
    self.failure = 0
    self.dupe = 0
    self.failures = []
    self.known_states = set()

  def add(self, stats, failures):
    # Aggregate common stats.
    self.total += stats['total']
    self.crash += stats['crash']
    self.timeout += stats['timeout']

    # Dedupe failures.
    for failure in failures:
      if failure['source'] in self.known_states:
        self.dupe += 1
        continue

      self.known_states.add(failure['source'])
      self.failure += 1
      self.failures.append(failure)

  @property
  def stats(self):
    return {
      'total': self.total,
      'crash': self.crash,
      'failure': self.failure,
      'dupe': self.dupe,
      'timeout': self.timeout,
    }

all_stats = Stats()
count = 0
pool = Pool(processes=PROCESSES)

# Iterate over all runs multiprocessed and merge the statistics and
# failure data of the single runs.
for stats, failures in pool.imap_unordered(run, range(RUNS)):
  all_stats.add(stats, failures)
  count += 1
  if count % max(1, int(RUNS / 20)) == 0:
    print('Progress: %d runs (%d%%)' % (count, count * 100 / RUNS))

  # Update overall stats.
  with open(os.path.join(TEST_CASES, 'stats.json'), 'w') as f:
    json.dump(all_stats.stats, f)
  with open(os.path.join(TEST_CASES, 'failures.json'), 'w') as f:
    json.dump(all_stats.failures, f)

print('Ran %(total)d test cases (%(timeout)d timeouts, '
      '%(crash)d crashes, %(failure)d failures, %(dupe)d dupes)'
      % all_stats.stats)

for failure in all_stats.failures:
  print(failure)
