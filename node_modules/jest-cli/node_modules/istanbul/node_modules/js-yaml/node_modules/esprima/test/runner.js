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

function sortedObject(o) {
    if (o === null) {
        return o;
    }
    if (Array.isArray(o)) {
        return o.map(sortedObject);
    }
    if (typeof o !== 'object') {
        return o;
    }
    if (o instanceof RegExp) {
        return o;
    }
    var keys = Object.keys(o);
    var result = {
        range: undefined,
        loc: undefined
    };
    keys.forEach(function (key) {
        if (o.hasOwnProperty(key)){
            result[key] = sortedObject(o[key]);
        }
    });
    return result;
}

function hasAttachedComment(syntax) {
    var key;
    for (key in syntax) {
        if (key === 'leadingComments' || key === 'trailingComments') {
            return true;
        }
       if (typeof syntax[key] === 'object' && syntax[key] !== null) {
           if (hasAttachedComment(syntax[key])) {
               return true;
           }
       }
    }
    return false;
}

function testParse(esprima, code, syntax) {
    'use strict';
    var expected, tree, actual, options, StringObject, i, len;

    // alias, so that JSLint does not complain.
    StringObject = String;

    options = {
        comment: (typeof syntax.comments !== 'undefined'),
        range: true,
        loc: true,
        tokens: (typeof syntax.tokens !== 'undefined'),
        raw: true,
        tolerant: (typeof syntax.errors !== 'undefined'),
        source: null,
        sourceType: syntax.sourceType
    };

    if (options.comment) {
        options.attachComment = hasAttachedComment(syntax);
    }

    if (typeof syntax.tokens !== 'undefined') {
        if (syntax.tokens.length > 0) {
            options.range = (typeof syntax.tokens[0].range !== 'undefined');
            options.loc = (typeof syntax.tokens[0].loc !== 'undefined');
        }
    }

    if (typeof syntax.comments !== 'undefined') {
        if (syntax.comments.length > 0) {
            options.range = (typeof syntax.comments[0].range !== 'undefined');
            options.loc = (typeof syntax.comments[0].loc !== 'undefined');
        }
    }

    if (options.loc) {
        options.source = syntax.loc.source;
    }

    syntax = sortedObject(syntax);
    expected = JSON.stringify(syntax, null, 4);
    try {
        // Some variations of the options.
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType });
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType, range: true });
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType, loc: true });

        tree = esprima.parse(code, options);

        if (options.tolerant) {
            for (i = 0, len = tree.errors.length; i < len; i += 1) {
                tree.errors[i] = errorToObject(tree.errors[i]);
            }
        }
        tree = sortedObject(tree);
        actual = JSON.stringify(tree, null, 4);

        // Only to ensure that there is no error when using string object.
        esprima.parse(new StringObject(code), options);

    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }

    function filter(key, value) {
        return (key === 'loc' || key === 'range') ? undefined : value;
    }

    if (options.tolerant) {
        return;
    }


    // Check again without any location info.
    options.range = false;
    options.loc = false;
    syntax = sortedObject(syntax);
    expected = JSON.stringify(syntax, filter, 4);
    try {
        tree = esprima.parse(code, options);

        if (options.tolerant) {
            for (i = 0, len = tree.errors.length; i < len; i += 1) {
                tree.errors[i] = errorToObject(tree.errors[i]);
            }
        }
        tree = sortedObject(tree);
        actual = JSON.stringify(tree, filter, 4);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
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


function testModule(esprima, code, exception) {
    'use strict';
    var i, options, expected, actual, err, handleInvalidRegexFlag, tokenize;

    // Different parsing options should give the same error.
    options = [
        { sourceType: 'module' },
        { sourceType: 'module', comment: true },
        { sourceType: 'module', raw: true },
        { sourceType: 'module', raw: true, comment: true }
    ];

    if (!exception.message) {
        exception.message = 'Error: Line 1: ' + exception.description;
    }
    exception.description = exception.message.replace(/Error: Line [0-9]+: /, '');

    expected = JSON.stringify(exception);

    for (i = 0; i < options.length; i += 1) {

        try {
            esprima.parse(code, options[i]);
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
    // will throw an exception. In some old version of V8, this is not the case
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
                esprima.tokenize(code, options[i]);
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

function testAPI(esprima, code, expected) {
    var result;
    // API test.
    expected = JSON.stringify(expected, null, 4);
    try {
        result = eval(code);
        result = JSON.stringify(result, null, 4);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== result) {
        throw new NotMatchingError(expected, result);
    }
}

function generateTestCase(esprima, testCase) {
    var tree, fileName = testCase.key + ".tree.json";
    try {
        tree = esprima.parse(testCase.case, {loc: true, range: true});
        tree = JSON.stringify(tree, null, 4);
    } catch (e) {
        if (typeof e.index === 'undefined') {
            console.error("Failed to generate test result.");
            throw e;
        }
        tree = errorToObject(e);
        tree.description = e.description;
        tree = JSON.stringify(tree);
        fileName = testCase.key + ".failure.json";
    }
    require('fs').writeFileSync(fileName, tree);
    console.error("Done.");
}

if (typeof window === 'undefined') {
    (function () {
        'use strict';

        var esprima = require('../esprima'),
            vm = require('vm'),
            fs = require('fs'),
            diff = require('json-diff').diffString,
            total = 0,
            result,
            failures = [],
            cases = {},
            context = {source: '', result: null},
            tick = new Date(),
            expected,
            testCase,
            header;

        function enumerateFixtures(root) {
            var dirs = fs.readdirSync(root), key, kind,
                kinds = ['case', 'source', 'module', 'run', 'tree', 'tokens', 'failure', 'result'],
                suffices = ['js', 'js', 'json', 'js', 'json', 'json', 'json', 'json'];

            dirs.forEach(function (item) {
                var i;
                if (fs.statSync(root + '/' + item).isDirectory()) {
                    enumerateFixtures(root + '/' + item);
                } else {
                    kind = 'case';
                    key = item.slice(0, -3);
                    for (i = 1; i < kinds.length; i++) {
                        var suffix = '.' + kinds[i] + '.' + suffices[i];
                        if (item.slice(-suffix.length) === suffix) {
                            key = item.slice(0, -suffix.length);
                            kind = kinds[i];
                        }
                    }
                    key = root + '/' + key;
                    if (!cases[key]) {
                        total++;
                        cases[key] = { key: key };
                    }
                    cases[key][kind] = fs.readFileSync(root + '/' + item, 'utf-8');
                }
            });
        }

        enumerateFixtures(__dirname + '/fixtures');

        for (var key in cases) {
            if (cases.hasOwnProperty(key)) {
                testCase = cases[key];

                if (testCase.hasOwnProperty('source')) {
                    testCase.case = eval(testCase.source + ';source');
                }

                try {
                    if (testCase.hasOwnProperty('module')) {
                        testModule(esprima, testCase.case, JSON.parse(testCase.module));
                    } else if (testCase.hasOwnProperty('tree')) {
                        testParse(esprima, testCase.case, JSON.parse(testCase.tree));
                    } else if (testCase.hasOwnProperty('tokens')) {
                        testTokenize(esprima, testCase.case, JSON.parse(testCase.tokens));
                    } else if (testCase.hasOwnProperty('failure')) {
                        testError(esprima, testCase.case, JSON.parse(testCase.failure));
                    } else if (testCase.hasOwnProperty('result')) {
                        testAPI(esprima, testCase.run, JSON.parse(testCase.result));
                    } else {
                        console.error('Incomplete test case:' + testCase.key + '. Generating test result...');
                        generateTestCase(esprima, testCase);
                    }
                } catch (e) {
                    if (!e.expected) {
                        throw e;
                    }
                    e.source = testCase.case || testCase.key;
                    failures.push(e);
                }
            }
        }

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
