## Istanbul - a JS code coverage tool written in JS

[![Build Status](https://secure.travis-ci.org/gotwarlost/istanbul.png)](http://travis-ci.org/gotwarlost/istanbul)
[![Dependency Status](https://gemnasium.com/gotwarlost/istanbul.png)](https://gemnasium.com/gotwarlost/istanbul)
[![Coverage Status](https://img.shields.io/coveralls/gotwarlost/istanbul.svg)](https://coveralls.io/r/gotwarlost/istanbul?branch=master)

[![NPM](https://nodei.co/npm/istanbul.png?downloads=true)](https://nodei.co/npm/istanbul/)

* [Features and use cases](#features)
* [Getting started and configuration](#getting-started)
* [The command line](#the-command-line)
* [Ignoring code for coverage](#ignoring-code-for-coverage)
* [API](#api)
* [Changelog](https://github.com/gotwarlost/istanbul/blob/master/CHANGELOG.md)
* [License and credits](#license)

### Features

* All-javascript instrumentation library that tracks **statement, branch,
and function coverage**.
* **Module loader hooks** to instrument code on the fly
* **Command line tools** to run node unit tests "with coverage turned on" and no cooperation
whatsoever from the test runner
* Multiple report formats: **HTML**, **LCOV**, **Cobertura** and more.
* Ability to use as [middleware](https://github.com/gotwarlost/istanbul-middleware) when serving JS files that need to be tested on the browser.
* Can be used on the **command line** as well as a **library**
* Based on the awesome `esprima` parser and the equally awesome `escodegen` code generator
* Well-tested on node (prev, current and next versions) and the browser (instrumentation library only)

### Use cases

Supports the following use cases and more

* transparent coverage of nodejs unit tests
* instrumentation/ reporting of files in batch mode for browser tests
* Server side code coverage for nodejs by embedding it as [custom middleware](https://github.com/gotwarlost/istanbul-middleware)

### Getting started

    $ npm install -g istanbul

The best way to see it in action is to run node unit tests. Say you have a test
script `test.js` that runs all tests for your node project without coverage.

Simply:

    $ cd /path/to/your/source/root
    $ istanbul cover test.js

and this should produce a `coverage.json`, `lcov.info` and `lcov-report/*html` under `./coverage`

Sample of code coverage reports produced by this tool (for this tool!):

[HTML reports](http://gotwarlost.github.com/istanbul/public/coverage/lcov-report/index.html)


### Configuring

Drop a `.istanbul.yml` file at the top of the source tree to configure istanbul.
`istanbul help config` tells you more about the config file format.

### The command line

    $ istanbul help

gives you detailed help on all commands.

```
Usage: istanbul help config | <command>

`config` provides help with istanbul configuration

Available commands are:

      check-coverage
              checks overall/per-file coverage against thresholds from coverage
              JSON files. Exits 1 if thresholds are not met, 0 otherwise


      cover   transparently adds coverage information to a node command. Saves
              coverage.json and reports at the end of execution


      help    shows help


      instrument
              instruments a file or a directory tree and writes the
              instrumented code to the desired output location


      report  writes reports for coverage JSON objects produced in a previous
              run


      test    cover a node command only when npm_config_coverage is set. Use in
              an `npm test` script for conditional coverage


Command names can be abbreviated as long as the abbreviation is unambiguous
```

To get detailed help for a command and what command-line options it supports, run:

    istanbul help <command>

(Most of the command line options are not covered in this document.)

#### The `cover` command

    $ istanbul cover my-test-script.js -- my test args
    # note the -- between the command name and the arguments to be passed

The `cover` command can be used to get a coverage object and reports for any arbitrary
node script. By default, coverage information is written under `./coverage` - this
can be changed using command-line options.

The `cover` command can also be passed an optional `--handle-sigint` flag to
enable writing reports when a user triggers a manual SIGINT of the process that is
being covered. This can be useful when you are generating coverage for a long lived process.

#### The `test` command

The `test` command has almost the same behavior as the `cover` command, except that
it skips coverage unless the `npm_config_coverage` environment variable is set.

**This command is deprecated** since the latest versions of npm do not seem to
set the `npm_config_coverage` variable.

#### The `instrument` command

Instruments a single JS file or an entire directory tree and produces an output
directory tree with instrumented code. This should not be required for running node
unit tests but is useful for tests to be run on the browser.

#### The `report` command

Writes reports using `coverage*.json` files as the source of coverage information.
Reports are available in multiple formats and can be individually configured
using the istanbul config file. See `istanbul help report` for more details.

#### The `check-coverage` command

Checks the coverage of statements, functions, branches, and lines against the
provided thresholds. Positive thresholds are taken to be the minimum percentage
required and negative numbers are taken to be the number of uncovered entities
allowed.

### Ignoring code for coverage

* Skip an `if` or `else` path with `/* istanbul ignore if */` or `/* istanbul ignore else */` respectively.
* For all other cases, skip the next 'thing' in the source with: `/* istanbul ignore next */`

See [ignoring-code-for-coverage.md](ignoring-code-for-coverage.md) for the spec.


### API

All the features of istanbul can be accessed as a library.

#### Instrument code

```javascript
    var istanbul = require('istanbul');
    var instrumenter = new istanbul.Instrumenter();

    var generatedCode = instrumenter.instrumentSync('function meaningOfLife() { return 42; }',
        'filename.js');
```

#### Generate reports given a bunch of coverage JSON objects

```javascript
    var istanbul = require('istanbul'),
        collector = new istanbul.Collector(),
        reporter = new istanbul.Reporter(),
        sync = false;

    collector.add(obj1);
    collector.add(obj2); //etc.

    reporter.add('text');
    reporter.addAll([ 'lcov', 'clover' ]);
    reporter.write(collector, sync, function () {
        console.log('All reports generated');
    });
```

For the gory details consult the [public API](http://gotwarlost.github.com/istanbul/public/apidocs/index.html)


### Multiple Process Usage

Istanbul can be used in a multiple process environment by running each process
with Istanbul, writing a unique coverage file for each process, and combining
the results when generating reports. The method used to perform this will
depend on the process forking API used. For example when using the
[cluster module](http://nodejs.org/api/cluster.html) you must setup the master
to start child processes with Istanbul coverage, disable reporting, and output
coverage files that include the PID in the filename.  Before each run you may
need to clear out the coverage data directory.

```javascript
    if(cluster.isMaster) {
        // setup cluster if running with istanbul coverage
        if(process.env.running_under_istanbul) {
            // use coverage for forked process
            // disabled reporting and output for child process
            // enable pid in child process coverage filename
            cluster.setupMaster({
                exec: './node_modules/.bin/istanbul',
                args: [
                    'cover', '--report', 'none', '--print', 'none', '--include-pid',
                    process.argv[1], '--'].concat(process.argv.slice(2))
            });
        }
        // ...
        // ... cluster.fork();
        // ...
    } else {
        // ... worker code
    }
```

### Coverage.json

For details on the format of the coverage.json object, [see here](./coverage.json.md).

### License

istanbul is licensed under the [BSD License](http://github.com/gotwarlost/istanbul/raw/master/LICENSE).

### Third-party libraries

The following third-party libraries are used by this module:

* abbrev: https://github.com/isaacs/abbrev-js -  to handle command abbreviations
* async: https://github.com/caolan/async - for parallel instrumentation of files
* escodegen: https://github.com/Constellation/escodegen - for JS code generation
* esprima: https://github.com/ariya/esprima - for JS parsing
* fileset: https://github.com/mklabs/node-fileset - for loading and matching path expressions
* handlebars: https://github.com/wycats/handlebars.js/ - for report template expansion
* js-yaml: https://github.com/nodeca/js-yaml - for YAML config file load
* mkdirp: https://github.com/substack/node-mkdirp - to create output directories
* nodeunit: https://github.com/caolan/nodeunit - dev dependency for unit tests
* nopt: https://github.com/isaacs/nopt - for option parsing
* once: https://github.com/isaacs/once - to ensure callbacks are called once
* resolve: https://github.com/substack/node-resolve - for resolving a post-require hook module name into its main file.
* rimraf - https://github.com/isaacs/rimraf - dev dependency for unit tests
* which: https://github.com/isaacs/node-which - to resolve a node command to a file for the `cover` command
* wordwrap: https://github.com/substack/node-wordwrap - for prettier help
* prettify: http://code.google.com/p/google-code-prettify/ - for syntax colored HTML reports. Files checked in under `lib/vendor/`

### Inspired by

* YUI test coverage - https://github.com/yui/yuitest - the grand-daddy of JS coverage tools. Istanbul has been specifically designed to offer an alternative to this library with an easy migration path.
* cover: https://github.com/itay/node-cover - the inspiration for the `cover` command, modeled after the `run` command in that tool. The coverage methodology used by istanbul is quite different, however

### Shout out to

   * [mfncooper](https://github.com/mfncooper) - for great brainstorming discussions
   * [reid](https://github.com/reid), [davglass](https://github.com/davglass), the YUI dudes, for interesting conversations, encouragement, support and gentle pressure to get it done :)

### Why the funky name?

Since all the good ones are taken. Comes from the loose association of ideas across
coverage, carpet-area coverage, the country that makes good carpets and so on...

