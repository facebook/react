import os
import subprocess
import sys

cwd = os.path.dirname(os.path.abspath(__file__))

num_deopts = {}
output = subprocess.check_output(
    'node --trace-deopt runner.js | grep DEOPT\: | grep -v "DEOPT:  " | cut -d" " -f3 | sort | uniq -c',
    shell=True,
    cwd=cwd
)

for line in output.split('\n'):
    line = line.strip()
    if len(line) == 0:
        continue
    count, name = line.split(' ', 1)
    num_deopts[name] = int(count)

if sys.argv[1:] == ['diag']:
    for count,name in reversed(sorted((count, name) for name,count in num_deopts.items())):
        print count, name
    sys.exit(0)

max_deopts = {}
with open(os.path.join(cwd, 'deopt_blacklist.txt')) as f:
    for line in f:
        name, count = line.strip().split(' ')
        count = int(count)
        max_deopts[name] = count

failures = set()
for name, count in max_deopts.items():
    if num_deopts.get(name, 0) > count:
        failures.add(name)

if len(failures) > 0:
    print 'ERROR: The following functions deopted that we didn\'t want to deopt:'
    for func in failures:
        print '  *', func, 'deopted:', num_deopts[func], '(expected', max_deopts[func], ')'
    sys.exit(1)
else:
    print 'OK'
