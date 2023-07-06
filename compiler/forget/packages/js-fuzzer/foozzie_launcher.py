#!/usr/bin/env python3
# Copyright 2020 the V8 project authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


"""
Launcher for the foozzie differential-fuzzing harness. Wraps foozzie
with Python2 for backwards-compatibility when bisecting.

Obsolete now after switching to Python3 entirely. We keep the launcher
for a transition period.
"""

import os
import re
import shutil
import subprocess
import sys

def find_harness_code(args):
  for arg in args:
    if arg.endswith('v8_foozzie.py'):
      with open(arg) as f:
        return f.read()
  assert False, 'Foozzie harness not found'

if __name__ == '__main__':
  # In some cases or older versions, the python executable is passed as
  # first argument. Let's be robust either way, with or without full
  # path or version.
  if re.match(r'.*python.*', sys.argv[1]):
    args = sys.argv[2:]
  else:
    args = sys.argv[1:]

  python_exe = 'python3'

  # To ease bisection of really old bugs, attempt to use Python2 as long
  # as it is supported. This enables bisection before the point where the
  # harness switched to Python3.
  script = find_harness_code(args)
  use_python3 = script.startswith('#!/usr/bin/env python3')
  if not use_python3 and shutil.which('python2'):
    python_exe = 'python2'

  process = subprocess.Popen([python_exe] + args)
  process.communicate()
  sys.exit(process.returncode)
