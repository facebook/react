#!/usr/bin/env python
# Copyright (c) 2015-present, Facebook, Inc.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

import math
import sys

import numpy as np
import numpy.random as npr
import scipy.stats


def _bootstrap_mean_sem(samples):
    """Return the estimated standard error for a distribution's mean."""
    samples = np.array(samples)
    n = len(samples)
    indices = npr.randint(0, n, (10000, n))
    samples = samples[indices]
    means = np.sort(np.mean(samples, axis=1))
    return np.std(means, ddof=1)


def _read_measurements(f):
    """Read measurements from a file.

    Returns {'a': [1.0, 2.0, 3.0], 'b': [5.0, 5.0, 5.0]} for a file containing
    the six lines: ['a 1', 'a 2', 'a 3', 'b 5', 'b 5', 'b 5'].
    """
    measurements = {}
    for line in f:
        label, value = line.split(None, 1)
        measurements.setdefault(label, []).append(float(value))
    return measurements


def _compute_mean_and_sd_of_ratio_from_delta_method(
    mean_test,
    sem_test,
    mean_control,
    sem_control
):
    mean = (
        ((mean_test - mean_control) / mean_control) -
        (pow(sem_control, 2) * mean_test / pow(mean_control, 3))
    )
    var = (
        pow(sem_test / mean_control, 2) +
        (pow(sem_control * mean_test, 2) / pow(mean_control, 4))
    )
    return (mean, math.sqrt(var))


def _main():
    if len(sys.argv) != 3:
        sys.stderr.write("usage: analyze.py control.txt test.txt\n")
        return 1

    ci_size = 0.99
    p_value = scipy.stats.norm.ppf(0.5 * (1 + ci_size))

    control, test = sys.argv[1:]
    with open(control) as f:
        control_measurements = _read_measurements(f)
    with open(test) as f:
        test_measurements = _read_measurements(f)
    keys = set()
    keys.update(control_measurements.iterkeys())
    keys.update(test_measurements.iterkeys())

    print "Comparing %s (control) vs %s (test)" % (control, test)
    print "Significant differences marked by ***"
    print "%% change from control to test, with %g%% CIs:" % (ci_size * 100,)
    print

    any_sig = False
    for key in sorted(keys):
        print "* %s" % (key,)
        control_nums = control_measurements.get(key, [])
        test_nums = test_measurements.get(key, [])
        if not control_nums or not test_nums:
            print "    skipping..."
            continue

        mean_control = np.mean(control_nums)
        mean_test = np.mean(test_nums)
        sem_control = _bootstrap_mean_sem(control_nums)
        sem_test = _bootstrap_mean_sem(test_nums)

        rat_mean, rat_sem = _compute_mean_and_sd_of_ratio_from_delta_method(
            mean_test, sem_test, mean_control, sem_control
        )
        rat_low = rat_mean - p_value * rat_sem
        rat_high = rat_mean + p_value * rat_sem

        sig = rat_high < 0 or rat_low > 0
        any_sig = any_sig or sig

        print "    %% change: %+6.2f%% [%+6.2f%%, %+6.2f%%]%s" % (
            100 * rat_mean,
            100 * rat_low,
            100 * rat_high,
            '  ***' if sig else ''
        )
        print "    means: %g (control), %g (test)" % (mean_control, mean_test)

if __name__ == '__main__':
    sys.exit(_main())
