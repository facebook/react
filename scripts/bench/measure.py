#!/usr/bin/env python
# Copyright (c) 2015-present, Facebook, Inc.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

import functools
import json
import os
import random
import subprocess
import sys


def _run_js_in_jsc(jit, js, env):
    return subprocess.check_output(
        ['jsc', '-e', """
            function now() {
                return preciseTime() * 1000;
            }
            function globalEval(code) {
                (0, eval)(code);
            }
            function report(label, time) {
                print(label + '_' + %(engine)s, time);
            }

            this.ENV = %(env)s;
            %(js)s
        """ % {
            'env': json.dumps(env),
            'js': js,
            'engine': json.dumps('jsc_' + ('jit' if jit else 'nojit')),
        }],
        env=dict(os.environ, JSC_useJIT='yes' if jit else 'no'),
    )

_run_js_in_jsc_jit = functools.partial(_run_js_in_jsc, True)
_run_js_in_jsc_nojit = functools.partial(_run_js_in_jsc, False)


def _run_js_in_node(js, env):
    return subprocess.check_output(
        ['node', '-e', """
            function now() {
                var hrTime = process.hrtime();
                return hrTime[0] * 1e3 + hrTime[1] * 1e-6;
            }
            function globalEval(code) {
                var vm = require('vm');
                // Hide "module" so UMD wrappers use the global
                vm.runInThisContext('(function(module){' + code + '\\n})()');
            }
            function readFile(filename) {
                var fs = require('fs');
                return fs.readFileSync(filename);
            }
            function report(label, time) {
                console.log(label + '_node', time);
            }

            global.ENV = %(env)s;
            %(js)s
        """ % {
            'env': json.dumps(env),
            'js': js
        }]
    )


def _measure_ssr_ms(engine, react_path, bench_name, bench_path, measure_warm):
    return engine(
        """
            var reactCode = readFile(ENV.react_path + '/react.min.js');
            var reactDOMServerCode = readFile(ENV.react_path + '/react-dom-server.min.js');
            var START = now();
            globalEval(reactCode);
            globalEval(reactDOMServerCode);
            var END = now();
            if (typeof React !== 'object') throw new Error('React not loaded');
            if (typeof ReactDOMServer !== 'object') throw new Error('ReactDOMServer not loaded');
            report('factory_ms', END - START);

            globalEval(readFile(ENV.bench_path));
            if (typeof Benchmark !== 'function') {
              throw new Error('benchmark not loaded');
            }
            var START = now();
            var html = ReactDOMServer.renderToString(React.createElement(Benchmark));
            html.charCodeAt(0);  // flatten ropes
            var END = now();
            report('ssr_' + ENV.bench_name + '_cold_ms', END - START);

            var warmup = ENV.measure_warm ? 80 : 0;
            var trials = ENV.measure_warm ? 40 : 0;

            for (var i = 0; i < warmup; i++) {
                ReactDOMServer.renderToString(React.createElement(Benchmark));
            }

            for (var i = 0; i < trials; i++) {
                var START = now();
                var html = ReactDOMServer.renderToString(React.createElement(Benchmark));
                html.charCodeAt(0);  // flatten ropes
                var END = now();
                report('ssr_' + ENV.bench_name + '_warm_ms', END - START);
            }
        """,
        {
            'bench_name': bench_name,
            'bench_path': bench_path,
            'measure_warm': measure_warm,
            'react_path': react_path,
        },
    )


def _main():
    if len(sys.argv) < 2 or len(sys.argv) % 2 == 0:
        sys.stderr.write("usage: measure.py build-folder-a a.txt build-folder-b b.txt\n")
        return 1
    # [(react_path, out_path)]
    react_paths = sys.argv[1::2]
    files = [open(out_path, 'w') for out_path in sys.argv[2::2]]

    trials = 30
    sys.stderr.write("Measuring SSR for PE benchmark (%d trials)\n" % trials)
    sys.stderr.write("_" * trials + "\n")
    for i in range(trials):
        for engine in [
            _run_js_in_jsc_jit,
            _run_js_in_jsc_nojit,
            _run_js_in_node
        ]:
            engines = range(len(react_paths))
            random.shuffle(engines)
            for i in engines:
                out = _measure_ssr_ms(engine, react_paths[i], 'pe', 'bench-pe-es5.js', False)
                files[i].write(out)
        sys.stderr.write(".")
        sys.stderr.flush()
    sys.stderr.write("\n")
    sys.stderr.flush()

    # You can set this to a number of trials you want to do with warm JIT.
    # They are disabled by default because they are slower.
    trials = 0

    sys.stderr.write("Measuring SSR for PE with warm JIT (%d slow trials)\n" % trials)
    sys.stderr.write("_" * trials + "\n")
    for i in range(trials):
        for engine in [
            _run_js_in_jsc_jit,
            _run_js_in_jsc_nojit,
            _run_js_in_node
        ]:
            engines = range(len(react_paths))
            random.shuffle(engines)
            for i in engines:
                out = _measure_ssr_ms(engine, react_paths[i], 'pe', 'bench-pe-es5.js', True)
                files[i].write(out)
        sys.stderr.write(".")
        sys.stderr.flush()
    sys.stderr.write("\n")
    sys.stderr.flush()

    for f in files:
        f.close()


if __name__ == '__main__':
    sys.exit(_main())

