import os
import subprocess
import sys

cwd = os.path.dirname(os.path.abspath(__file__))

output = subprocess.check_output(
    'node --trace-opt-verbose --trace-deopt runner.js',
    shell=True,
    cwd=cwd
)

num_deopts = {}
optimized_functions = set()

for line in output.split('\n'):
    line = line.strip()
    if len(line) == 0:
        continue
    if line.startswith('**** DEOPT:'):
        name = line.split(' ')[2]
        if len(name) == 0:
            # TODO: why?
            continue
        num_deopts[name] = num_deopts.get(name, 0) + 1
    elif line.startswith('[optimizing:'):
        name = line.split(' ')[1]
        optimized_functions.add(name)

if sys.argv[1:] == ['diag']:
    for count,name in reversed(sorted((count, name) for name,count in num_deopts.items())):
        print count, name
    sys.exit(0)

max_deopts = {}
with open(os.path.join(cwd, 'deopt_blacklist.txt')) as f:
    for line in f:
        line = line.strip()
        if len(line) == 0:
            continue
        name, count = line.split(' ')
        count = int(count)
        max_deopts[name] = count

failures = {}
for name, count in max_deopts.items():
    if num_deopts.get(name, 0) > count:
        failures[name] = 'deopt'
    elif name not in optimized_functions:
        failures[name] = 'never optimized'

if len(failures) > 0:
    print 'ERROR: The following functions deopted that we didn\'t want to deopt:'
    for func, reason in failures.items():
        if reason == 'deopt':
            print '  *', func, 'deopted:', num_deopts[func], '(expected', max_deopts[func], ')'
        else:
            print '  *', func, 'never optimized'
    sys.exit(1)
else:
    print 'OK'
