/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2011 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2011 Arpad Borsos <arpad.borsos@googlemail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint browser:true node:true */
/*global esprima:true, testFixture:true */

var runTests;

// Special handling for regular expression literal since we need to
// convert it to a string literal, otherwise it will be decoded
// as object "{}" and the regular expression would be lost.
function adjustRegexLiteral(key, value) {
    'use strict';
    if (key === 'value' && value instanceof RegExp) {
        value = value.toString();
    }
    return value;
}

function NotMatchingError(expected, actual) {
    'use strict';
    Error.call(this, 'Expected ');
    this.expected = expected;
    this.actual = actual;
}
NotMatchingError.prototype = new Error();

function errorToObject(e) {
    'use strict';
    var msg = e.toString();

    // Opera 9.64 produces an non-standard string in toString().
    if (msg.substr(0, 6) !== 'Error:') {
        if (typeof e.message === 'string') {
            msg = 'Error: ' + e.message;
        }
    }

    return {
        index: e.index,
        lineNumber: e.lineNumber,
        column: e.column,
        message: msg
    };
}

function needLoc(syntax) {
    var need = true;
    if (typeof syntax.tokens !== 'undefined' && syntax.tokens.length > 0) {
        need = (typeof syntax.tokens[0].loc !== 'undefined');
    }
    if (typeof syntax.comments !== 'undefined' && syntax.comments.length > 0) {
        need = (typeof syntax.comments[0].loc !== 'undefined');
    }
    return need;
}

function needRange(syntax) {
    var need = true;
    if (typeof syntax.tokens !== 'undefined' && syntax.tokens.length > 0) {
        need = (typeof syntax.tokens[0].range !== 'undefined');
    }
    if (typeof syntax.comments !== 'undefined' && syntax.comments.length > 0) {
        need = (typeof syntax.comments[0].range !== 'undefined');
    }
    return need;
}

function testParse(esprima, code, syntax) {
    'use strict';
    var expected, tree, actual, options, StringObject, i, len, err;

    // alias, so that JSLint does not complain.
    StringObject = String;

    options = {
        comment: (typeof syntax.comments !== 'undefined'),
        range: needRange(syntax),
        loc: needLoc(syntax),
        tokens: (typeof syntax.tokens !== 'undefined'),
        raw: true,
        tolerant: (typeof syntax.errors !== 'undefined'),
        source: null
    };

    if (options.loc) {
        options.source = syntax.loc.source;
    }

    expected = JSON.stringify(syntax, null, 4);
    try {
        tree = esprima.parse(code, options);
        tree = (options.comment || options.tokens || options.tolerant) ? tree : tree.body[0];

        if (options.tolerant) {
            for (i = 0, len = tree.errors.length; i < len; i += 1) {
                tree.errors[i] = errorToObject(tree.errors[i]);
            }
        }

        actual = JSON.stringify(tree, adjustRegexLiteral, 4);

        // Only to ensure that there is no error when using string object.
        esprima.parse(new StringObject(code), options);

    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }

    function filter(key, value) {
        if (key === 'value' && value instanceof RegExp) {
            value = value.toString();
        }
        return (key === 'loc' || key === 'range') ? undefined : value;
    }

    if (options.tolerant) {
        return;
    }


    // Check again without any location info.
    options.range = false;
    options.loc = false;
    expected = JSON.stringify(syntax, filter, 4);
    try {
        tree = esprima.parse(code, options);
        tree = (options.comment || options.tokens) ? tree : tree.body[0];

        if (options.tolerant) {
            for (i = 0, len = tree.errors.length; i < len; i += 1) {
                tree.errors[i] = errorToObject(tree.errors[i]);
            }
        }

        actual = JSON.stringify(tree, filter, 4);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function mustHaveLocRange(testName, node, needLoc, needRange, stack) {
    var error;
    if (node.hasOwnProperty('type')) {
      if (needLoc && !node.loc) {
        error = "doesn't have 'loc' property";
      }
      if (needRange && !node.range) {
        error = "doesn't have 'range' property";
      }
      if (error) {
        stack = stack.length ? ' at [' + stack.join('][') + ']' : '';
        throw new Error("Test '" + testName + "'" + stack + " (type = " + node.type + ") " + error);
      }
    }
    for (i in node) {
        if (node.hasOwnProperty(i) && node[i] !== null && typeof node[i] === 'object') {
            stack.push(i);
            mustHaveLocRange(testName, node[i], needLoc, needRange, stack);
            stack.pop();
        }
    }
}

function testTokenize(esprima, code, tokens) {
    'use strict';
    var options, expected, actual, tree;

    options = {
        comment: true,
        tolerant: true,
        loc: true,
        range: true
    };

    expected = JSON.stringify(tokens, null, 4);

    try {
        tree = esprima.tokenize(code, options);
        actual = JSON.stringify(tree, null, 4);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function testError(esprima, code, exception) {
    'use strict';
    var i, options, expected, actual, err, handleInvalidRegexFlag, tokenize;

    // Different parsing options should give the same error.
    options = [
        {},
        { comment: true },
        { raw: true },
        { raw: true, comment: true }
    ];

    // If handleInvalidRegexFlag is true, an invalid flag in a regular expression
    // will throw an exception. In some old version V8, this is not the case
    // and hence handleInvalidRegexFlag is false.
    handleInvalidRegexFlag = false;
    try {
        'test'.match(new RegExp('[a-z]', 'x'));
    } catch (e) {
        handleInvalidRegexFlag = true;
    }

    exception.description = exception.message.replace(/Error: Line [0-9]+: /, '');

    if (exception.tokenize) {
        tokenize = true;
        exception.tokenize = undefined;
    }
    expected = JSON.stringify(exception);

    for (i = 0; i < options.length; i += 1) {

        try {
            if (tokenize) {
                esprima.tokenize(code, options[i])
            } else {
                esprima.parse(code, options[i]);
            }
        } catch (e) {
            err = errorToObject(e);
            err.description = e.description;
            actual = JSON.stringify(err);
        }

        if (expected !== actual) {

            // Compensate for old V8 which does not handle invalid flag.
            if (exception.message.indexOf('Invalid regular expression') > 0) {
                if (typeof actual === 'undefined' && !handleInvalidRegexFlag) {
                    return;
                }
            }

            throw new NotMatchingError(expected, actual);
        }

    }
}

function testAPI(esprima, code, result) {
    'use strict';
    var expected, res, actual;

    expected = JSON.stringify(result.result, null, 4);
    try {
        if (typeof result.property !== 'undefined') {
            res = esprima[result.property];
        } else {
            res = esprima[result.call].apply(esprima, result.args);
        }
        actual = JSON.stringify(res, adjustRegexLiteral, 4);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function runTest(esprima, code, result) {
    'use strict';
    if (result.hasOwnProperty('lineNumber')) {
        testError(esprima, code, result);
    } else if (result.hasOwnProperty('result')) {
        testAPI(esprima, code, result);
    } else if (result instanceof Array) {
        testTokenize(esprima, code, result);
    } else {
        testParse(esprima, code, result);
    }
}

if (typeof window !== 'undefined') {
    // Run all tests in a browser environment.
    runTests = function () {
        'use strict';
        var total = 0,
            failures = 0,
            category,
            fixture,
            source,
            tick,
            expected,
            index,
            len;

        function setText(el, str) {
            if (typeof el.innerText === 'string') {
                el.innerText = str;
            } else {
                el.textContent = str;
            }
        }

        function startCategory(category) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('h4');
            setText(e, category);
            report.appendChild(e);
        }

        function reportSuccess(code) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            setText(e, code);
            report.appendChild(e);
        }

        function reportFailure(code, expected, actual) {
            var report, e;

            report = document.getElementById('report');

            e = document.createElement('p');
            setText(e, 'Code:');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            setText(e, code);
            report.appendChild(e);

            e = document.createElement('p');
            setText(e, 'Expected');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'expected');
            setText(e, expected);
            report.appendChild(e);

            e = document.createElement('p');
            setText(e, 'Actual');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'actual');
            setText(e, actual);
            report.appendChild(e);
        }

        setText(document.getElementById('version'), esprima.version);

        tick = new Date();
        for (category in testFixture) {
            if (testFixture.hasOwnProperty(category)) {
                startCategory(category);
                fixture = testFixture[category];
                for (source in fixture) {
                    if (fixture.hasOwnProperty(source)) {
                        expected = fixture[source];
                        total += 1;
                        try {
                            runTest(esprima, source, expected);
                            reportSuccess(source, JSON.stringify(expected, null, 4));
                        } catch (e) {
                            failures += 1;
                            reportFailure(source, e.expected, e.actual);
                        }
                    }
                }
            }
        }
        tick = (new Date()) - tick;

        if (failures > 0) {
            document.getElementById('status').className = 'alert-box alert';
            setText(document.getElementById('status'), total + ' tests. ' +
                'Failures: ' + failures + '. ' + tick + ' ms.');
        } else {
            document.getElementById('status').className = 'alert-box success';
            setText(document.getElementById('status'), total + ' tests. ' +
                'No failure. ' + tick + ' ms.');
        }
    };
} else {
    (function () {
        'use strict';

        var esprima = require('../esprima'),
            vm = require('vm'),
            fs = require('fs'),
            diff = require('json-diff').diffString,
            total = 0,
            failures = [],
            tick = new Date(),
            expected,
            header;

        vm.runInThisContext(fs.readFileSync(__dirname + '/test.js', 'utf-8'));
        vm.runInThisContext(fs.readFileSync(__dirname + '/harmonytest.js', 'utf-8'));
        vm.runInThisContext(fs.readFileSync(__dirname + '/fbtest.js', 'utf-8'));

        Object.keys(testFixture).forEach(function (category) {
            Object.keys(testFixture[category]).forEach(function (source) {
                total += 1;
                expected = testFixture[category][source];
                if (!expected.hasOwnProperty('lineNumber') && !expected.hasOwnProperty('result')) {
                    mustHaveLocRange(source, expected, needLoc(expected), needRange(expected), []);
                }
                try {
                    runTest(esprima, source, expected);
                } catch (e) {
                    e.source = source;
                    failures.push(e);
                }
            });
        });
        tick = (new Date()) - tick;

        header = total + ' tests. ' + failures.length + ' failures. ' +
            tick + ' ms';
        if (failures.length) {
            console.error(header);
            failures.forEach(function (failure) {
                try {
                    var expectedObject = JSON.parse(failure.expected);
                    var actualObject = JSON.parse(failure.actual);

                    console.error(failure.source + ': Expected\n    ' +
                        failure.expected.split('\n').join('\n    ') +
                        '\nto match\n    ' + failure.actual + '\nDiff:\n' +
                        diff(expectedObject, actualObject));
                } catch (ex) {
                    console.error(failure.source + ': Expected\n    ' +
                        failure.expected.split('\n').join('\n    ') +
                        '\nto match\n    ' + failure.actual);
                }
            });
        } else {
            console.log(header);
        }
        process.exit(failures.length === 0 ? 0 : 1);
    }());
}
