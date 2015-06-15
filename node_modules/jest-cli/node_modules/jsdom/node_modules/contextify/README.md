# Contextify

For Windows issues, see here: https://github.com/brianmcd/contextify/wiki/Windows-Installation-Guide

Please add to the wiki if you find new issues/solutions.

Turn an object into a V8 execution context.  A contextified object acts as the global 'this' when executing scripts in its context.  Contextify adds 3 methods to the contextified object: run(code, filename), getGlobal(), and dispose().  The main difference between Contextify and Node's vm methods is that Contextify allows asynchronous functions to continue executing in the Contextified object's context.  See vm vs. Contextify below for more discussion.

## Examples
```javascript
var Contextify = require('contextify');
var sandbox = { console : console, prop1 : 'prop1'};
Contextify(sandbox);
sandbox.run('console.log(prop1);');
sandbox.dispose(); // free the resources allocated for the context.
```

```javascript
var sandbox = Contextify(); // returns an empty contextified object.
sandbox.run('var x = 3;');
console.log(sandbox.x); // prints 3
sandbox.dispose();
```

```javascript
var sandbox = Contextify({setTimeout : setTimeout});
sandbox.run("setTimeout(function () { x = 3; }, 5);");
console.log(sandbox.x); // prints undefined
setTimeout(function () {
    console.log(sandbox.x); // prints 3
    sandbox.dispose();
}, 10);
```
## Details

**Contextify([sandbox])**

    sandbox - The object to contextify, which will be modified as described below
              If no sandbox is specified, an empty object will be allocated and used instead.

    Returns the contextified object.  It doesn't make a copy, so if you already have a reference
    to the sandbox, you don't need to catch the return value.

A Contextified object has 2 methods added to it:

**run(code, [filename])**

    code - string containing JavaScript to execute
    filename  - an optional filename for debugging.

    Runs the code in the Contextified object's context.

**getGlobal()**

Returns the actual global object for the V8 context.  The global object is initialized with interceptors (discussed below) which forward accesses on it to the contextified object.  This means the contextified object acts like the global object in most cases.  Sometimes, though, you need to make a reference to the actual global object.

For example:

```javascript
var window = Contextify({console : console});
window.window = window;
window.run("console.log(window === this);");
// prints false.
```

```javascript
var window = Contextify({console : console});
window.window = window.getGlobal();
window.run("console.log(window === this);");
// prints true
```

The global object returned by getGlobal() can be treated like the contextified sandbox object, except that defining getters/setters will not work on it.  Define getters and setters on the actual sandbox object instead.

**dispose()**

Frees the memory allocated for the underlying V8 context.  If you don't call this when you're done, the V8 context memory will leak, as will the sandbox memory, since the context's global stores a strong reference to the sandbox object.  You can still use your sandbox object after calling dispose(), but it's unsafe to use a global previously returned from getGlobal().  run, getGlobal, and dispose will be removed from the sandbox object.

## Install

    npm install contextify

## require('vm') vs. Contextify

Node's vm functions (runInContext etc) work by copying the values from the sandbox object onto a context's global object, executing the passed in script, then copying the results back.  This means that scripts that create asynchronous functions (using mechanisms like setTimeout) won't have see the results of executing those functions, since the copying in/out only occurs during an explicit call to runInContext and friends.  

Contextify creates a V8 context, and uses interceptors (see: http://code.google.com/apis/v8/embed.html#interceptors) to forward global object accesses to the sandbox object.  This means there is no copying in or out, so asynchronous functions have the expected effect on the sandbox object.  

## Tests

Testing is done with nodeunit.  Run the tests with

    nodeunit test/

Output: 

    OK: 92 assertions (27ms)


## Building

    node-gyp rebuild

## Acknowledgments

Inspiration taken from Assaf's Zombie.js context solution: https://github.com/assaf/zombie
