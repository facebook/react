import os
import subprocess
import sys

cwd = os.path.dirname(os.path.abspath(__file__))

data = [line.strip() for line in subprocess.check_output(
    'node --trace-deopt runner.js | grep DEOPT\: | grep -v "DEOPT:  " | cut -d" " -f3 | sort | uniq',
    shell=True,
    cwd=cwd
).split('\n')]

with open(os.path.join(cwd, 'deopt_blacklist.txt')) as f:
    blacklist = [line.strip() for line in f.readlines()]

failures = set(blacklist).intersection(set(data))

if len(failures) > 0:
    print 'ERROR: The following functions deopted that we didn\'t want to deopt:'
    for func in failures:
        print '  * ' + func
    sys.exit(1)
else:
    print 'OK'
