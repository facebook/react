<a href="http://promisesaplus.com/">
    <img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.1 compliant" align="right" />
</a>
[![Build Status](https://travis-ci.org/petkaantonov/bluebird.svg?branch=master)](https://travis-ci.org/petkaantonov/bluebird)
[![coverage-98%](http://img.shields.io/badge/coverage-98%-brightgreen.svg?style=flat)](http://petkaantonov.github.io/bluebird/coverage/debug/index.html)


# Introduction

Bluebird is a fully featured [promise](#what-are-promises-and-why-should-i-use-them) library with focus on innovative features and performance



# Topics

- [Features](#features)
- [Quick start](#quick-start)
- [API Reference and examples](API.md)
- [Support](#support)
- [What are promises and why should I use them?](#what-are-promises-and-why-should-i-use-them)
- [Questions and issues](#questions-and-issues)
- [Error handling](#error-handling)
- [Development](#development)
    - [Testing](#testing)
    - [Benchmarking](#benchmarks)
    - [Custom builds](#custom-builds)
    - [For library authors](#for-library-authors)
- [What is the sync build?](#what-is-the-sync-build)
- [License](#license)
- [Snippets for common problems](https://github.com/petkaantonov/bluebird/wiki/Snippets)
- [Promise anti-patterns](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns)
- [Changelog](changelog.md)
- [Optimization guide](#optimization-guide)

# Features
<img src="http://petkaantonov.github.io/bluebird/logo.png" alt="bluebird logo" align="right" />

- [Promises A+](http://promisesaplus.com)
- [Synchronous inspection](API.md#synchronous-inspection)
- [Concurrency coordination](API.md#collections)
- [Promisification on steroids](API.md#promisification)
- [Resource management through a parallel of python `with`/C# `using`](API.md#resource-management)
- [Cancellation and timeouts](API.md#cancellation)
- [Parallel for C# `async` and `await`](API.md#generators)
- Mind blowing utilities such as
    - [`.bind()`](API.md#binddynamic-thisarg---promise)
    - [`.call()`](API.md#callstring-propertyname--dynamic-arg---promise)
    - [`Promise.join()`](API.md#promisejoinpromisethenablevalue-promises-function-handler---promise)
    - [And](API.md#core) [much](API.md#timers) [more](API.md#utility)!
- [Practical debugging solutions and sane defaults](#error-handling)
- [Sick performance](benchmark/)

<hr>

# Quick start

## Node.js

    npm install bluebird

Then:

```js
var Promise = require("bluebird");
```

## Browsers

There are many ways to use bluebird in browsers:

- Direct downloads
    - Full build [bluebird.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.js)
    - Full build minified [bluebird.min.js](https://cdn.jsdelivr.net/bluebird/latest/bluebird.min.js)
- You may use browserify on the main export
- You may use the [bower](http://bower.io) package.

When using script tags the global variables `Promise` and `P` (alias for `Promise`) become available.

A [minimal bluebird browser build](#custom-builds) is &asymp;38.92KB minified*, 11.65KB gzipped and has no external dependencies.

*Google Closure Compiler using Simple.

#### Browser support

Browsers that [implement ECMA-262, edition 3](http://en.wikipedia.org/wiki/Ecmascript#Implementations) and later are supported.

[![Selenium Test Status](https://saucelabs.com/browser-matrix/petka_antonov.svg)](https://saucelabs.com/u/petka_antonov)

**Note** that in ECMA-262, edition 3 (IE7, IE8 etc.) it is not possible to use methods that have keyword names like `.catch` and `.finally`. The [API documentation](API.md) always lists a compatible alternative name that you can use if you need to support these browsers. For example `.catch` is replaced with `.caught` and `.finally` with `.lastly`.

Also, [long stack trace](API.md#promiselongstacktraces---void) support is only available in Chrome, Firefox and Internet Explorer 10+.

After quick start, see [API Reference and examples](API.md)

<hr>

# Support

- Mailing list: [bluebird-js@googlegroups.com](https://groups.google.com/forum/#!forum/bluebird-js)
- IRC: #promises @freenode
- StackOverflow: [bluebird tag](http://stackoverflow.com/questions/tagged/bluebird)
- Bugs and feature requests: [github issue tracker](https://github.com/petkaantonov/bluebird/issues?state=open)

<hr>

# What are promises and why should I use them?

You should use promises to turn this:

```js
fs.readFile("file.json", function(err, val) {
    if( err ) {
        console.error("unable to read file");
    }
    else {
        try {
            val = JSON.parse(val);
            console.log(val.success);
        }
        catch( e ) {
            console.error("invalid json in file");
        }
    }
});
```

Into this:

```js
fs.readFileAsync("file.json").then(JSON.parse).then(function(val) {
    console.log(val.success);
})
.catch(SyntaxError, function(e) {
    console.error("invalid json in file");
})
.catch(function(e) {
    console.error("unable to read file")
});
```

*If you are wondering "there is no `readFileAsync` method on `fs` that returns a promise", see [promisification](API.md#promisification)*

Actually you might notice the latter has a lot in common with code that would do the same using synchronous I/O:

```js
try {
    var val = JSON.parse(fs.readFileSync("file.json"));
    console.log(val.success);
}
//Syntax actually not supported in JS but drives the point
catch(SyntaxError e) {
    console.error("invalid json in file");
}
catch(Error e) {
    console.error("unable to read file")
}
```

And that is the point - being able to have something that is a lot like `return` and `throw` in synchronous code.

You can also use promises to improve code that was written with callback helpers:


```js
//Copyright Plato http://stackoverflow.com/a/19385911/995876
//CC BY-SA 2.5
mapSeries(URLs, function (URL, done) {
    var options = {};
    needle.get(URL, options, function (error, response, body) {
        if (error) {
            return done(error)
        }
        try {
            var ret = JSON.parse(body);
            return done(null, ret);
        }
        catch (e) {
            done(e);
        }
    });
}, function (err, results) {
    if (err) {
        console.log(err)
    } else {
        console.log('All Needle requests successful');
        // results is a 1 to 1 mapping in order of URLs > needle.body
        processAndSaveAllInDB(results, function (err) {
            if (err) {
                return done(err)
            }
            console.log('All Needle requests saved');
            done(null);
        });
    }
});
```

Is more pleasing to the eye when done with promises:

```js
Promise.promisifyAll(needle);
var options = {};

var current = Promise.resolve();
Promise.map(URLs, function(URL) {
    current = current.then(function () {
        return needle.getAsync(URL, options);
    });
    return current;
}).map(function(responseAndBody){
    return JSON.parse(responseAndBody[1]);
}).then(function (results) {
    return processAndSaveAllInDB(results);
}).then(function(){
    console.log('All Needle requests saved');
}).catch(function (e) {
    console.log(e);
});
```

Also promises don't just give you correspondences for synchronous features but can also be used as limited event emitters or callback aggregators.

More reading:

 - [Promise nuggets](https://promise-nuggets.github.io/)
 - [Why I am switching to promises](http://spion.github.io/posts/why-i-am-switching-to-promises.html)
 - [What is the the point of promises](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/#toc_1)
 - [Snippets for common problems](https://github.com/petkaantonov/bluebird/wiki/Snippets)
 - [Promise anti-patterns](https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns)

# Questions and issues

If you find a bug in bluebird or have a feature request, file an issue in the [github issue tracker](https://github.com/petkaantonov/bluebird/issues). Anything else, such as questions for help in using the library, should be posted in [StackOverflow](http://stackoverflow.com/questions/tagged/bluebird) under tags `promise` and `bluebird`.

# Error handling

This is a problem every promise library needs to handle in some way. Unhandled rejections/exceptions don't really have a good agreed-on asynchronous correspondence. The problem is that it is impossible to predict the future and know if a rejected promise will eventually be handled.

There are two common pragmatic attempts at solving the problem that promise libraries do.

The more popular one is to have the user explicitly communicate that they are done and any unhandled rejections should be thrown, like so:

```js
download().then(...).then(...).done();
```

For handling this problem, in my opinion, this is completely unacceptable and pointless. The user must remember to explicitly call `.done` and that cannot be justified when the problem is forgetting to create an error handler in the first place.

The second approach, which is what bluebird by default takes, is to call a registered handler if a rejection is unhandled by the start of a second turn. The default handler is to write the stack trace to `stderr` or `console.error` in browsers. This is close to what happens with synchronous code - your code doesn't work as expected and you open console and see a stack trace. Nice.

Of course this is not perfect, if your code for some reason needs to swoop in and attach error handler to some promise after the promise has been hanging around a while then you will see annoying messages. In that case you can use the `.done()` method to signal that any hanging exceptions should be thrown.

If you want to override the default handler for these possibly unhandled rejections, you can pass yours like so:

```js
Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});
```

If you want to also enable long stack traces, call:

```js
Promise.longStackTraces();
```

right after the library is loaded.

In node.js use the environment flag `BLUEBIRD_DEBUG`:

```
BLUEBIRD_DEBUG=1 node server.js
```

to enable long stack traces in all instances of bluebird.

Long stack traces cannot be disabled after being enabled, and cannot be enabled after promises have already been created. Long stack traces imply a substantial performance penalty, even after using every trick to optimize them.

Long stack traces are enabled by default in the debug build.

#### Expected and unexpected errors

A practical problem with Promises/A+ is that it models Javascript `try-catch` too closely for its own good. Therefore by default promises inherit `try-catch` warts such as the inability to specify the error types that the catch block is eligible for. It is an anti-pattern in every other language to use catch-all handlers because they swallow exceptions that you might not know about.

Now, Javascript does have a perfectly fine and working way of creating error type hierarchies. It is still quite awkward to use them with the built-in `try-catch` however:

```js
try {
    //code
}
catch(e) {
    if( e instanceof WhatIWantError) {
        //handle
    }
    else {
        throw e;
    }
}
```

Without such checking, unexpected errors would be silently swallowed. However, with promises, bluebird brings the future (hopefully) here now and extends the `.catch` to [accept potential error type eligibility](API.md#catchfunction-errorclass-function-handler---promise).

For instance here it is expected that some evil or incompetent entity will try to crash our server from `SyntaxError` by providing syntactically invalid JSON:

```js
getJSONFromSomewhere().then(function(jsonString) {
    return JSON.parse(jsonString);
}).then(function(object) {
    console.log("it was valid json: ", object);
}).catch(SyntaxError, function(e){
    console.log("don't be evil");
});
```

Here any kind of unexpected error will be automatically reported on `stderr` along with a stack trace because we only register a handler for the expected `SyntaxError`.

Ok, so, that's pretty neat. But actually not many libraries define error types and it is in fact a complete ghetto out there with ad hoc strings being attached as some arbitrary property name like `.name`, `.type`, `.code`, not having any property at all or even throwing strings as errors and so on. So how can we still listen for expected errors?

Bluebird defines a special error type `OperationalError` (you can get a reference from `Promise.OperationalError`). This type of error is given as rejection reason by promisified methods when
their underlying library gives an untyped, but expected error. Primitives such as strings, and error objects that are directly created like `new Error("database didn't respond")` are considered untyped.

Example of such library is the node core library `fs`. So if we promisify it, we can catch just the errors we want pretty easily and have programmer errors be redirected to unhandled rejection handler so that we notice them:

```js
//Read more about promisification in the API Reference:
//API.md
var fs = Promise.promisifyAll(require("fs"));

fs.readFileAsync("myfile.json").then(JSON.parse).then(function (json) {
    console.log("Successful json")
}).catch(SyntaxError, function (e) {
    console.error("file contains invalid json");
}).catch(Promise.OperationalError, function (e) {
    console.error("unable to read file, because: ", e.message);
});
```

The last `catch` handler is only invoked when the `fs` module explicitly used the `err` argument convention of async callbacks to inform of an expected error. The `OperationalError` instance will contain the original error in its `.cause` property but it does have a direct copy of the `.message` and `.stack` too. In this code any unexpected error - be it in our code or the `fs` module - would not be caught by these handlers and therefore not swallowed.

Since a `catch` handler typed to `Promise.OperationalError` is expected to be used very often, it has a neat shorthand:

```js
.error(function (e) {
    console.error("unable to read file, because: ", e.message);
});
```

See [API documentation for `.error()`](API.md#error-rejectedhandler----promise)

Finally, Bluebird also supports predicate-based filters. If you pass a
predicate function instead of an error type, the predicate will receive
the error as an argument. The return result will be used to determine whether
the error handler should be called.

Predicates should allow for very fine grained control over caught errors:
pattern matching, error typesets with set operations and many other techniques
can be implemented on top of them.

Example of using a predicate-based filter:

```js
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));

function clientError(e) {
    return e.code >= 400 && e.code < 500;
}

request("http://www.google.com").then(function(contents){
    console.log(contents);
}).catch(clientError, function(e){
   //A client error like 400 Bad Request happened
});
```

**Danger:** The JavaScript language allows throwing primitive values like strings. Throwing primitives can lead to worse or no stack traces. Primitives [are not exceptions](http://www.devthought.com/2011/12/22/a-string-is-not-an-error/). You should consider always throwing Error objects when handling exceptions.

<hr>

#### How do long stack traces differ from e.g. Q?

Bluebird attempts to have more elaborate traces. Consider:

```js
Error.stackTraceLimit = 25;
Q.longStackSupport = true;
Q().then(function outer() {
    return Q().then(function inner() {
        return Q().then(function evenMoreInner() {
            a.b.c.d();
        }).catch(function catcher(e){
            console.error(e.stack);
        });
    })
});
```

You will see

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:7:13)
    From previous event:
        at inner (<anonymous>:6:20)

Compare to:

```js
Error.stackTraceLimit = 25;
Promise.longStackTraces();
Promise.resolve().then(function outer() {
    return Promise.resolve().then(function inner() {
        return Promise.resolve().then(function evenMoreInner() {
            a.b.c.d()
        }).catch(function catcher(e){
            console.error(e.stack);
        });
    });
});
```

    ReferenceError: a is not defined
        at evenMoreInner (<anonymous>:7:13)
    From previous event:
        at inner (<anonymous>:6:36)
    From previous event:
        at outer (<anonymous>:5:32)
    From previous event:
        at <anonymous>:4:21
        at Object.InjectedScript._evaluateOn (<anonymous>:572:39)
        at Object.InjectedScript._evaluateAndWrap (<anonymous>:531:52)
        at Object.InjectedScript.evaluate (<anonymous>:450:21)


A better and more practical example of the differences can be seen in gorgikosev's [debuggability competition](https://github.com/spion/async-compare#debuggability).

<hr>

# Development

For development tasks such as running benchmarks or testing, you need to clone the repository and install dev-dependencies.

Install [node](http://nodejs.org/) and [npm](https://npmjs.org/)

    git clone git@github.com:petkaantonov/bluebird.git
    cd bluebird
    npm install

## Testing

To run all tests, run

    node tools/test

If you need to run generator tests run the `tool/test.js` script with `--harmony` argument and node 0.11+:

    node-dev --harmony tools/test

You may specify an individual test file to run with the `--run` script flag:

    node tools/test --run=cancel.js


This enables output from the test and may give a better idea where the test is failing. The paramter to `--run` can be any file name located in `test/mocha` folder.

#### Testing in browsers

To run the test in a browser instead of node, pass the flag `--browser` to the test tool

    node tools/test --run=cancel.js --browser

This will automatically create a server (default port 9999) and open it in your default browser once the tests have been compiled.

Keep the test tab active because some tests are timing-sensitive and will fail if the browser is throttling timeouts. Chrome will do this for example when the tab is not active.

#### Supported options by the test tool

The value of boolean flags is determined by presence, if you want to pass false value for a boolean flag, use the `no-`-prefix e.g. `--no-browser`.

 - `--run=String`. Which tests to run (or compile when testing in browser). Default `"all"`. Can also be a glob string (relative to ./test/mocha folder)
 - `--cover=String`. Create code coverage using the String as istanbul reporter. Coverage is created in the ./coverage folder. No coverage is created by default, default reporter is `"html"` (use `--cover` to use default reporter).
 - `--browser` - Whether to compile tests for browsers. Default `false`.
 - `--port=Number` - Whe port where local server is hosted when testing in browser. Default `9999`
 - `--execute-browser-tests` - Whether to execute the compiled tests for browser when using `--browser`. Default `true`.
 - `--open-browser` - Whether to open the default browser when executing browser tests. Default `true`.
 - `--fake-timers` - Whether to use fake timers (`setTimeout` etc) when running tests in node. Default `true`.
 - `--js-hint` - Whether to run JSHint on source files. Default `true`.
 - `--saucelabs` Wheter to create a tunnel to sauce labs and run tests in their VMs instead of your browser when compiling tests for browser.Default `false`.

## Benchmarks

To run a benchmark, run the given command for a benchmark while on the project root. Requires bash (on windows the mingw32 that comes with git works fine too).

Node 0.11.2+ is required to run the generator examples.

### 1\. DoxBee sequential

Currently the most relevant benchmark is @gorkikosev's benchmark in the article [Analysis of generators and other async patterns in node](http://spion.github.io/posts/analysis-generators-and-other-async-patterns-node.html). The benchmark emulates a situation where n amount of users are making a request in parallel to execute some mixed async/sync action. The benchmark has been modified to include a warm-up phase to minimize any JITing during timed sections.

Command: `bench doxbee`

### 2\. Made-up parallel

This made-up scenario runs 15 shimmed queries in parallel.

Command: `bench parallel`

## Custom builds

Custom builds for browsers are supported through a command-line utility.


<table>
    <caption>The following features can be disabled</caption>
    <thead>
        <tr>
            <th>Feature(s)</th>
            <th>Command line identifier</th>
        </tr>
    </thead>
    <tbody>

        <tr><td><a href="API.md#any---promise"><code>.any</code></a> and <a href="API.md#promiseanyarraydynamicpromise-values---promise"><code>Promise.any</code></a></td><td><code>any</code></td></tr>
        <tr><td><a href="API.md#race---promise"><code>.race</code></a> and <a href="API.md#promiseracearraypromise-promises---promise"><code>Promise.race</code></a></td><td><code>race</code></td></tr>
        <tr><td><a href="API.md#callstring-propertyname--dynamic-arg---promise"><code>.call</code></a> and <a href="API.md#getstring-propertyname---promise"><code>.get</code></a></td><td><code>call_get</code></td></tr>
        <tr><td><a href="API.md#filterfunction-filterer---promise"><code>.filter</code></a> and <a href="API.md#promisefilterarraydynamicpromise-values-function-filterer---promise"><code>Promise.filter</code></a></td><td><code>filter</code></td></tr>
        <tr><td><a href="API.md#mapfunction-mapper---promise"><code>.map</code></a> and <a href="API.md#promisemaparraydynamicpromise-values-function-mapper---promise"><code>Promise.map</code></a></td><td><code>map</code></td></tr>
        <tr><td><a href="API.md#reducefunction-reducer--dynamic-initialvalue---promise"><code>.reduce</code></a> and <a href="API.md#promisereducearraydynamicpromise-values-function-reducer--dynamic-initialvalue---promise"><code>Promise.reduce</code></a></td><td><code>reduce</code></td></tr>
        <tr><td><a href="API.md#props---promise"><code>.props</code></a> and <a href="API.md#promisepropsobjectpromise-object---promise"><code>Promise.props</code></a></td><td><code>props</code></td></tr>
        <tr><td><a href="API.md#settle---promise"><code>.settle</code></a> and <a href="API.md#promisesettlearraydynamicpromise-values---promise"><code>Promise.settle</code></a></td><td><code>settle</code></td></tr>
        <tr><td><a href="API.md#someint-count---promise"><code>.some</code></a> and <a href="API.md#promisesomearraydynamicpromise-values-int-count---promise"><code>Promise.some</code></a></td><td><code>some</code></td></tr>
        <tr><td><a href="API.md#nodeifyfunction-callback---promise"><code>.nodeify</code></a></td><td><code>nodeify</code></td></tr>
        <tr><td><a href="API.md#promisecoroutinegeneratorfunction-generatorfunction---function"><code>Promise.coroutine</code></a> and <a href="API.md#promisespawngeneratorfunction-generatorfunction---promise"><code>Promise.spawn</code></a></td><td><code>generators</code></td></tr>
        <tr><td><a href="API.md#progression">Progression</a></td><td><code>progress</code></td></tr>
        <tr><td><a href="API.md#promisification">Promisification</a></td><td><code>promisify</code></td></tr>
        <tr><td><a href="API.md#cancellation">Cancellation</a></td><td><code>cancel</code></td></tr>
        <tr><td><a href="API.md#timers">Timers</a></td><td><code>timers</code></td></tr>
        <tr><td><a href="API.md#resource-management">Resource management</a></td><td><code>using</code></td></tr>

    </tbody>
</table>


Make sure you have cloned the repo somewhere and did `npm install` successfully.

After that you can run:

    node tools/build --features="core"


The above builds the most minimal build you can get. You can add more features separated by spaces from the above list:

    node tools/build --features="core filter map reduce"

The custom build file will be found from `/js/browser/bluebird.js`. It will have a comment that lists the disabled and enabled features.

Note that the build leaves the `/js/main` etc folders with same features so if you use the folder for node.js at the same time, don't forget to build
a full version afterwards (after having taken a copy of the bluebird.js somewhere):

    node tools/build --debug --main --zalgo --browser --minify

#### Supported options by the build tool

The value of boolean flags is determined by presence, if you want to pass false value for a boolean flag, use the `no-`-prefix e.g. `--no-debug`.

 - `--main` - Whether to build the main build. The main build is placed at `js/main` directory. Default `false`.
 - `--debug` - Whether to build the debug build. The debug build is placed at `js/debug` directory. Default `false`.
 - `--zalgo` - Whether to build the zalgo build. The zalgo build is placed at `js/zalgo` directory. Default `false`.
 - `--browser` - Whether to compile the browser build. The browser build file is placed at `js/browser/bluebird.js` Default `false`.
 - `--minify` - Whether to minify the compiled browser build. The minified browser build file is placed at `js/browser/bluebird.min.js` Default `true`.
 - `--features=String` - See [custom builds](#custom-builds)

<hr>

## For library authors

Building a library that depends on bluebird? You should know about a few features.

If your library needs to do something obtrusive like adding or modifying methods on the `Promise` prototype, uses long stack traces or uses a custom unhandled rejection handler then... that's totally ok as long as you don't use `require("bluebird")`. Instead you should create a file
that creates an isolated copy. For example, creating a file called `bluebird-extended.js` that contains:

```js
                //NOTE the function call right after
module.exports = require("bluebird/js/main/promise")();
```

Your library can then use `var Promise = require("bluebird-extended");` and do whatever it wants with it. Then if the application or other library uses their own bluebird promises they will all play well together because of Promises/A+ thenable assimilation magic.

You should also know about [`.nodeify()`](API.md#nodeifyfunction-callback---promise) which makes it easy to provide a dual callback/promise API.

<hr>

## What is the sync build?

You may now use sync build by:

    var Promise = require("bluebird/zalgo");

The sync build is provided to see how forced asynchronity affects benchmarks. It should not be used in real code due to the implied hazards.

The normal async build gives Promises/A+ guarantees about asynchronous resolution of promises. Some people think this affects performance or just plain love their code having a possibility
of stack overflow errors and non-deterministic behavior.

The sync build skips the async call trampoline completely, e.g code like:

    async.invoke( this.fn, this, val );

Appears as this in the sync build:

    this.fn(val);

This should pressure the CPU slightly less and thus the sync build should perform better. Indeed it does, but only marginally. The biggest performance boosts are from writing efficient Javascript, not from compromising determinism.

Note that while some benchmarks are waiting for the next event tick, the CPU is actually not in use during that time. So the resulting benchmark result is not completely accurate because on node.js you only care about how much the CPU is taxed. Any time spent on CPU is time the whole process (or server) is paralyzed. And it is not graceful like it would be with threads.


```js
var cache = new Map(); //ES6 Map or DataStructures/Map or whatever...
function getResult(url) {
    var resolver = Promise.pending();
    if (cache.has(url)) {
        resolver.resolve(cache.get(url));
    }
    else {
        http.get(url, function(err, content) {
            if (err) resolver.reject(err);
            else {
                cache.set(url, content);
                resolver.resolve(content);
            }
        });
    }
    return resolver.promise;
}



//The result of console.log is truly random without async guarantees
function guessWhatItPrints( url ) {
    var i = 3;
    getResult(url).then(function(){
        i = 4;
    });
    console.log(i);
}
```

# Optimization guide

Articles about optimization will be periodically posted in [the wiki section](https://github.com/petkaantonov/bluebird/wiki), polishing edits are welcome.

A single cohesive guide compiled from the articles will probably be done eventually.

# License

The MIT License (MIT)

Copyright (c) 2014 Petka Antonov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
