![hoek Logo](https://raw.github.com/hapijs/hoek/master/images/hoek.png)

Utility methods for the hapi ecosystem. This module is not intended to solve every problem for everyone, but rather as a central place to store hapi-specific methods. If you're looking for a general purpose utility module, check out [lodash](https://github.com/lodash/lodash) or [underscore](https://github.com/jashkenas/underscore).

[![Build Status](https://secure.travis-ci.org/hapijs/hoek.png)](http://travis-ci.org/hapijs/hoek)

Lead Maintainer: [Nathan LaFreniere](https://github.com/nlf)

# Table of Contents

* [Introduction](#introduction "Introduction")
* [Object](#object "Object")
  * [clone](#cloneobj "clone")
  * [cloneWithShallow](#clonewithshallowobj-keys "cloneWithShallow")
  * [merge](#mergetarget-source-isnulloverride-ismergearrays "merge")
  * [applyToDefaults](#applytodefaultsdefaults-options-isnulloverride "applyToDefaults")
  * [applyToDefaultsWithShallow](#applytodefaultswithshallowdefaults-options-keys "applyToDefaultsWithShallow")
  * [deepEqual](#deepequala-b "deepEqual")
  * [unique](#uniquearray-key "unique")
  * [mapToObject](#maptoobjectarray-key "mapToObject")
  * [intersect](#intersectarray1-array2 "intersect")
  * [contain](#containref-values-options "contain")
  * [flatten](#flattenarray-target "flatten")
  * [reach](#reachobj-chain-options "reach")
  * [reachTemplate](#reachobj-template-options "reachTemplate")
  * [transform](#transformobj-transform-options "transform")
  * [shallow](#shallowobj "shallow")
  * [stringify](#stringifyobj "stringify")
* [Timer](#timer "Timer")
* [Bench](#bench "Bench")
* [Binary Encoding/Decoding](#binary-encodingdecoding "Binary Encoding/Decoding")
  * [base64urlEncode](#base64urlencodevalue "binary64urlEncode")
  * [base64urlDecode](#base64urldecodevalue "binary64urlDecode")
* [Escaping Characters](#escaping-characters "Escaping Characters")
  * [escapeHtml](#escapehtmlstring "escapeHtml")
  * [escapeHeaderAttribute](#escapeheaderattributeattribute "escapeHeaderAttribute")
  * [escapeRegex](#escaperegexstring "escapeRegex")
* [Errors](#errors "Errors")
  * [assert](#assertcondition-message "assert")
  * [abort](#abortmessage "abort")
  * [displayStack](#displaystackslice "displayStack")
  * [callStack](#callstackslice "callStack")
* [Function](#function "Function")
  * [nextTick](#nexttickfn "nextTick")
  * [once](#oncefn "once")
  * [ignore](#ignore "ignore")
* [Miscellaneous](#miscellaneous "Miscellaneous")
  * [uniqueFilename](#uniquefilename "uniqueFilename")
  * [isInteger](#isInteger "isInteger")



# Introduction

The *Hoek* library contains some common functions used within the hapi ecosystem. It comes with useful methods for Arrays (clone, merge, applyToDefaults), Objects (removeKeys, copy), Asserting and more.

For example, to use Hoek to set configuration with default options:
```javascript
var Hoek = require('hoek');

var default = {url : "www.github.com", port : "8000", debug : true};

var config = Hoek.applyToDefaults(default, {port : "3000", admin : true});

// In this case, config would be { url: 'www.github.com', port: '3000', debug: true, admin: true }
```

Under each of the sections (such as Array), there are subsections which correspond to Hoek methods. Each subsection will explain how to use the corresponding method. In each js excerpt below, the `var Hoek = require('hoek');` is omitted for brevity.

## Object

Hoek provides several helpful methods for objects and arrays.

### clone(obj)

This method is used to clone an object or an array. A *deep copy* is made (duplicates everything, including values that are objects, as well as non-enumerable properties).

```javascript

var nestedObj = {
        w: /^something$/ig,
        x: {
            a: [1, 2, 3],
            b: 123456,
            c: new Date()
        },
        y: 'y',
        z: new Date()
    };

var copy = Hoek.clone(nestedObj);

copy.x.b = 100;

console.log(copy.y);        // results in 'y'
console.log(nestedObj.x.b); // results in 123456
console.log(copy.x.b);      // results in 100
```

### cloneWithShallow(obj, keys)
keys is an array of key names to shallow copy

This method is also used to clone an object or array, however any keys listed in the `keys` array are shallow copied while those not listed are deep copied.

```javascript

var nestedObj = {
        w: /^something$/ig,
        x: {
            a: [1, 2, 3],
            b: 123456,
            c: new Date()
        },
        y: 'y',
        z: new Date()
    };

var copy = Hoek.cloneWithShallow(nestedObj, ['x']);

copy.x.b = 100;

console.log(copy.y);        // results in 'y'
console.log(nestedObj.x.b); // results in 100
console.log(copy.x.b);      // results in 100
```

### merge(target, source, isNullOverride, isMergeArrays)
isNullOverride, isMergeArrays default to true

Merge all the properties of source into target, source wins in conflict, and by default null and undefined from source are applied.
Merge is destructive where the target is modified. For non destructive merge, use `applyToDefaults`.


```javascript

var target = {a: 1, b : 2};
var source = {a: 0, c: 5};
var source2 = {a: null, c: 5};

Hoek.merge(target, source);         // results in {a: 0, b: 2, c: 5}
Hoek.merge(target, source2);        // results in {a: null, b: 2, c: 5}
Hoek.merge(target, source2, false); // results in {a: 1, b: 2, c: 5}

var targetArray = [1, 2, 3];
var sourceArray = [4, 5];

Hoek.merge(targetArray, sourceArray);              // results in [1, 2, 3, 4, 5]
Hoek.merge(targetArray, sourceArray, true, false); // results in [4, 5]
```

### applyToDefaults(defaults, options, isNullOverride)
isNullOverride defaults to false

Apply options to a copy of the defaults

```javascript

var defaults = { host: "localhost", port: 8000 };
var options = { port: 8080 };

var config = Hoek.applyToDefaults(defaults, options); // results in { host: "localhost", port: 8080 }
```

Apply options with a null value to a copy of the defaults

```javascript

var defaults = { host: "localhost", port: 8000 };
var options = { host: null, port: 8080 };

var config = Hoek.applyToDefaults(defaults, options, true); // results in { host: null, port: 8080 }
```

### applyToDefaultsWithShallow(defaults, options, keys)
keys is an array of key names to shallow copy

Apply options to a copy of the defaults. Keys specified in the last parameter are shallow copied from options instead of merged.

```javascript

var defaults = {
        server: {
            host: "localhost",
            port: 8000
        },
        name: 'example'
    };

var options = { server: { port: 8080 } };

var config = Hoek.applyToDefaults(defaults, options); // results in { server: { port: 8080 }, name: 'example' }
```

### deepEqual(b, a, [options])

Performs a deep comparison of the two values including support for circular dependencies, prototype, and properties. To skip prototype comparisons, use `options.prototype = false`

```javascript
Hoek.deepEqual({ a: [1, 2], b: 'string', c: { d: true } }, { a: [1, 2], b: 'string', c: { d: true } }); //results in true
Hoek.deepEqual(Object.create(null), {}, { prototype: false }); //results in true
Hoek.deepEqual(Object.create(null), {}); //results in false
```

### unique(array, key)

Remove duplicate items from Array

```javascript

var array = [1, 2, 2, 3, 3, 4, 5, 6];

var newArray = Hoek.unique(array);    // results in [1,2,3,4,5,6]

array = [{id: 1}, {id: 1}, {id: 2}];

newArray = Hoek.unique(array, "id");  // results in [{id: 1}, {id: 2}]
```

### mapToObject(array, key)

Convert an Array into an Object

```javascript

var array = [1,2,3];
var newObject = Hoek.mapToObject(array);   // results in [{"1": true}, {"2": true}, {"3": true}]

array = [{id: 1}, {id: 2}];
newObject = Hoek.mapToObject(array, "id"); // results in [{"id": 1}, {"id": 2}]
```

### intersect(array1, array2)

Find the common unique items in two arrays

```javascript

var array1 = [1, 2, 3];
var array2 = [1, 4, 5];

var newArray = Hoek.intersect(array1, array2); // results in [1]
```

### contain(ref, values, [options])

Tests if the reference value contains the provided values where:
- `ref` - the reference string, array, or object.
- `values` - a single or array of values to find within the `ref` value. If `ref` is an object, `values` can be a key name,
  an array of key names, or an object with key-value pairs to compare.
- `options` - an optional object with the following optional settings:
    - `deep` - if `true`, performed a deep comparison of the values.
    - `once` - if `true`, allows only one occurrence of each value.
    - `only` - if `true`, does not allow values not explicitly listed.
    - `part` - if `true`, allows partial match of the values (at least one must always match).

Note: comparing a string to overlapping values will result in failed comparison (e.g. `contain('abc', ['ab', 'bc'])`).
Also, if an object key's value does not match the provided value, `false` is returned even when `part` is specified.

```javascript
Hoek.contain('aaa', 'a', { only: true });							// true
Hoek.contain([{ a: 1 }], [{ a: 1 }], { deep: true });				// true
Hoek.contain([1, 2, 2], [1, 2], { once: true });					// false
Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, d: 4 }, { part: true }); // true
```

### flatten(array, [target])

Flatten an array

```javascript

var array = [1, [2, 3]];

var flattenedArray = Hoek.flatten(array); // results in [1, 2, 3]

array = [1, [2, 3]];
target = [4, [5]];

flattenedArray = Hoek.flatten(array, target); // results in [4, [5], 1, 2, 3]
```

### reach(obj, chain, [options])

Converts an object key chain string to reference

- `options` - optional settings
    - `separator` - string to split chain path on, defaults to '.'
    - `default` - value to return if the path or value is not present, default is `undefined`
    - `strict` - if `true`, will throw an error on missing member, default is `false`
    - `functions` - if `true` allow traversing functions for properties. `false` will throw an error if a function is part of the chain.

A chain including negative numbers will work like negative indices on an
array.

```javascript

var chain = 'a.b.c';
var obj = {a : {b : { c : 1}}};

Hoek.reach(obj, chain); // returns 1

var chain = 'a.b.-1';
var obj = {a : {b : [2,3,6]}};

Hoek.reach(obj, chain); // returns 6
```

### reachTemplate(obj, template, [options])

Replaces string parameters (`{name}`) with their corresponding object key values by applying the
(`reach()`)[#reachobj-chain-options] method where:

- `obj` - the context object used for key lookup.
- `template` - a string containing `{}` parameters.
- `options` - optional (`reach()`)[#reachobj-chain-options] options.

```javascript

var chain = 'a.b.c';
var obj = {a : {b : { c : 1}}};

Hoek.reachTemplate(obj, '1+{a.b.c}=2'); // returns '1+1=2'
```

### transform(obj, transform, [options])

Transforms an existing object into a new one based on the supplied `obj` and `transform` map. `options` are the same as the `reach` options.

```javascript
var source = {
    address: {
        one: '123 main street',
        two: 'PO Box 1234'
    },
    title: 'Warehouse',
    state: 'CA'
};

var result = Hoek.transform(source, {
    'person.address.lineOne': 'address.one',
    'person.address.lineTwo': 'address.two',
    'title': 'title',
    'person.address.region': 'state'
});
// Results in
// {
//     person: {
//         address: {
//             lineOne: '123 main street',
//             lineTwo: 'PO Box 1234',
//             region: 'CA'
//         }
//     },
//     title: 'Warehouse'
// }
```

### shallow(obj)

Performs a shallow copy by copying the references of all the top level children where:
- `obj` - the object to be copied.

```javascript
var shallow = Hoek.shallow({ a: { b: 1 } });
```

### stringify(obj)

Converts an object to string using the built-in `JSON.stringify()` method with the difference that any errors are caught
and reported back in the form of the returned string. Used as a shortcut for displaying information to the console (e.g. in
error message) without the need to worry about invalid conversion.

```javascript
var a = {};
a.b = a;
Hoek.stringify(a);		// Returns '[Cannot display object: Converting circular structure to JSON]'
```

# Timer

A Timer object. Initializing a new timer object sets the ts to the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.

```javascript

var timerObj = new Hoek.Timer();
console.log("Time is now: " + timerObj.ts);
console.log("Elapsed time from initialization: " + timerObj.elapsed() + 'milliseconds');
```


# Bench

Same as Timer with the exception that `ts` stores the internal node clock which is not related to `Date.now()` and cannot be used to display
human-readable timestamps. More accurate for benchmarking or internal timers.

# Binary Encoding/Decoding

### base64urlEncode(value)

Encodes value in Base64 or URL encoding

### base64urlDecode(value)

Decodes data in Base64 or URL encoding.
# Escaping Characters

Hoek provides convenient methods for escaping html characters. The escaped characters are as followed:

```javascript

internals.htmlEscaped = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
};
```

### escapeHtml(string)

```javascript

var string = '<html> hey </html>';
var escapedString = Hoek.escapeHtml(string); // returns &lt;html&gt; hey &lt;/html&gt;
```

### escapeHeaderAttribute(attribute)

Escape attribute value for use in HTTP header

```javascript

var a = Hoek.escapeHeaderAttribute('I said "go w\\o me"');  //returns I said \"go w\\o me\"
```


### escapeRegex(string)

Escape string for Regex construction

```javascript

var a = Hoek.escapeRegex('4^f$s.4*5+-_?%=#!:@|~\\/`"(>)[<]d{}s,');  // returns 4\^f\$s\.4\*5\+\-_\?%\=#\!\:@\|~\\\/`"\(>\)\[<\]d\{\}s\,
```

# Errors

### assert(condition, message)

```javascript

var a = 1, b = 2;

Hoek.assert(a === b, 'a should equal b');  // Throws 'a should equal b'
```

Note that you may also pass an already created Error object as the second parameter, and `assert` will throw that object.

```javascript

var a = 1, b = 2;

Hoek.assert(a === b, new Error('a should equal b')); // Throws the given error object
```

### abort(message)

First checks if `process.env.NODE_ENV === 'test'`, and if so, throws error message. Otherwise,
displays most recent stack and then exits process.



### displayStack(slice)

Displays the trace stack

```javascript

var stack = Hoek.displayStack();
console.log(stack); // returns something like:

[ 'null (/Users/user/Desktop/hoek/test.js:4:18)',
  'Module._compile (module.js:449:26)',
  'Module._extensions..js (module.js:467:10)',
  'Module.load (module.js:356:32)',
  'Module._load (module.js:312:12)',
  'Module.runMain (module.js:492:10)',
  'startup.processNextTick.process._tickCallback (node.js:244:9)' ]
```

### callStack(slice)

Returns a trace stack array.

```javascript

var stack = Hoek.callStack();
console.log(stack);  // returns something like:

[ [ '/Users/user/Desktop/hoek/test.js', 4, 18, null, false ],
  [ 'module.js', 449, 26, 'Module._compile', false ],
  [ 'module.js', 467, 10, 'Module._extensions..js', false ],
  [ 'module.js', 356, 32, 'Module.load', false ],
  [ 'module.js', 312, 12, 'Module._load', false ],
  [ 'module.js', 492, 10, 'Module.runMain', false ],
  [ 'node.js',
    244,
    9,
    'startup.processNextTick.process._tickCallback',
    false ] ]
```

## Function

### nextTick(fn)

Returns a new function that wraps `fn` in `process.nextTick`.

```javascript

var myFn = function () {
    console.log('Do this later');
};

var nextFn = Hoek.nextTick(myFn);

nextFn();
console.log('Do this first');

// Results in:
//
// Do this first
// Do this later
```

### once(fn)

Returns a new function that can be run multiple times, but makes sure `fn` is only run once.

```javascript

var myFn = function () {
    console.log('Ran myFn');
};

var onceFn = Hoek.once(myFn);
onceFn(); // results in "Ran myFn"
onceFn(); // results in undefined
```

### ignore

A simple no-op function. It does nothing at all.

## Miscellaneous

### uniqueFilename(path, extension)
`path` to prepend with the randomly generated file name. `extension` is the optional file extension, defaults to `''`.

Returns a randomly generated file name at the specified `path`. The result is a fully resolved path to a file.

```javascript
var result = Hoek.uniqueFilename('./test/modules', 'txt'); // results in "full/path/test/modules/{random}.txt"
```

### isInteger(value)

Check `value` to see if it is an integer.  Returns true/false.

```javascript
var result = Hoek.isInteger('23')
```
