# Async.js

[![Build Status via Travis CI](https://travis-ci.org/caolan/async.svg?branch=master)](https://travis-ci.org/caolan/async)


Async is a utility module which provides straight-forward, powerful functions
for working with asynchronous JavaScript. Although originally designed for
use with [Node.js](http://nodejs.org) and installable via `npm install async`,
it can also be used directly in the browser.

Async is also installable via:

- [bower](http://bower.io/): `bower install async`
- [component](https://github.com/component/component): `component install
  caolan/async`
- [jam](http://jamjs.org/): `jam install async`
- [spm](http://spmjs.io/): `spm install async`

Async provides around 20 functions that include the usual 'functional'
suspects (`map`, `reduce`, `filter`, `each`…) as well as some common patterns
for asynchronous control flow (`parallel`, `series`, `waterfall`…). All these
functions assume you follow the Node.js convention of providing a single
callback as the last argument of your `async` function.


## Quick Examples

```javascript
async.map(['file1','file2','file3'], fs.stat, function(err, results){
    // results is now an array of stats for each file
});

async.filter(['file1','file2','file3'], fs.exists, function(results){
    // results now equals an array of the existing files
});

async.parallel([
    function(){ ... },
    function(){ ... }
], callback);

async.series([
    function(){ ... },
    function(){ ... }
]);
```

There are many more functions available so take a look at the docs below for a
full list. This module aims to be comprehensive, so if you feel anything is
missing please create a GitHub issue for it.

## Common Pitfalls

### Binding a context to an iterator

This section is really about `bind`, not about `async`. If you are wondering how to
make `async` execute your iterators in a given context, or are confused as to why
a method of another library isn't working as an iterator, study this example:

```js
// Here is a simple object with an (unnecessarily roundabout) squaring method
var AsyncSquaringLibrary = {
  squareExponent: 2,
  square: function(number, callback){ 
    var result = Math.pow(number, this.squareExponent);
    setTimeout(function(){
      callback(null, result);
    }, 200);
  }
};

async.map([1, 2, 3], AsyncSquaringLibrary.square, function(err, result){
  // result is [NaN, NaN, NaN]
  // This fails because the `this.squareExponent` expression in the square
  // function is not evaluated in the context of AsyncSquaringLibrary, and is
  // therefore undefined.
});

async.map([1, 2, 3], AsyncSquaringLibrary.square.bind(AsyncSquaringLibrary), function(err, result){
  // result is [1, 4, 9]
  // With the help of bind we can attach a context to the iterator before
  // passing it to async. Now the square function will be executed in its 
  // 'home' AsyncSquaringLibrary context and the value of `this.squareExponent`
  // will be as expected.
});
```

## Download

The source is available for download from
[GitHub](http://github.com/caolan/async).
Alternatively, you can install using Node Package Manager (`npm`):

    npm install async

__Development:__ [async.js](https://github.com/caolan/async/raw/master/lib/async.js) - 29.6kb Uncompressed

## In the Browser

So far it's been tested in IE6, IE7, IE8, FF3.6 and Chrome 5. 

Usage:

```html
<script type="text/javascript" src="async.js"></script>
<script type="text/javascript">

    async.map(data, asyncProcess, function(err, results){
        alert(results);
    });

</script>
```

## Documentation

### Collections

* [`each`](#each)
* [`eachSeries`](#eachSeries)
* [`eachLimit`](#eachLimit)
* [`map`](#map)
* [`mapSeries`](#mapSeries)
* [`mapLimit`](#mapLimit)
* [`filter`](#filter)
* [`filterSeries`](#filterSeries)
* [`reject`](#reject)
* [`rejectSeries`](#rejectSeries)
* [`reduce`](#reduce)
* [`reduceRight`](#reduceRight)
* [`detect`](#detect)
* [`detectSeries`](#detectSeries)
* [`sortBy`](#sortBy)
* [`some`](#some)
* [`every`](#every)
* [`concat`](#concat)
* [`concatSeries`](#concatSeries)

### Control Flow

* [`series`](#seriestasks-callback)
* [`parallel`](#parallel)
* [`parallelLimit`](#parallellimittasks-limit-callback)
* [`whilst`](#whilst)
* [`doWhilst`](#doWhilst)
* [`until`](#until)
* [`doUntil`](#doUntil)
* [`forever`](#forever)
* [`waterfall`](#waterfall)
* [`compose`](#compose)
* [`seq`](#seq)
* [`applyEach`](#applyEach)
* [`applyEachSeries`](#applyEachSeries)
* [`queue`](#queue)
* [`priorityQueue`](#priorityQueue)
* [`cargo`](#cargo)
* [`auto`](#auto)
* [`retry`](#retry)
* [`iterator`](#iterator)
* [`apply`](#apply)
* [`nextTick`](#nextTick)
* [`times`](#times)
* [`timesSeries`](#timesSeries)

### Utils

* [`memoize`](#memoize)
* [`unmemoize`](#unmemoize)
* [`log`](#log)
* [`dir`](#dir)
* [`noConflict`](#noConflict)


## Collections

<a name="forEach" />
<a name="each" />
### each(arr, iterator, callback)

Applies the function `iterator` to each item in `arr`, in parallel.
The `iterator` is called with an item from the list, and a callback for when it
has finished. If the `iterator` passes an error to its `callback`, the main
`callback` (for the `each` function) is immediately called with the error.

Note, that since this function applies `iterator` to each item in parallel,
there is no guarantee that the iterator functions will complete in order.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err)` which must be called once it has 
  completed. If no error has occurred, the `callback` should be run without 
  arguments or with an explicit `null` argument.
* `callback(err)` - A callback which is called when all `iterator` functions
  have finished, or an error occurs.

__Examples__


```js
// assuming openFiles is an array of file names and saveFile is a function
// to save the modified contents of that file:

async.each(openFiles, saveFile, function(err){
    // if any of the saves produced an error, err would equal that error
});
```

```js
// assuming openFiles is an array of file names 

async.each(openFiles, function(file, callback) {
  
  // Perform operation on file here.
  console.log('Processing file ' + file);
  
  if( file.length > 32 ) {
    console.log('This file name is too long');
    callback('File name too long');
  } else {
    // Do work to process file here
    console.log('File processed');
    callback();
  }
}, function(err){
    // if any of the file processing produced an error, err would equal that error
    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A file failed to process');
    } else {
      console.log('All files have been processed successfully');
    }
});
```

---------------------------------------

<a name="forEachSeries" />
<a name="eachSeries" />
### eachSeries(arr, iterator, callback)

The same as [`each`](#each), only `iterator` is applied to each item in `arr` in
series. The next `iterator` is only called once the current one has completed. 
This means the `iterator` functions will complete in order.


---------------------------------------

<a name="forEachLimit" />
<a name="eachLimit" />
### eachLimit(arr, limit, iterator, callback)

The same as [`each`](#each), only no more than `limit` `iterator`s will be simultaneously 
running at any time.

Note that the items in `arr` are not processed in batches, so there is no guarantee that 
the first `limit` `iterator` functions will complete before any others are started.

__Arguments__

* `arr` - An array to iterate over.
* `limit` - The maximum number of `iterator`s to run at any time.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err)` which must be called once it has 
  completed. If no error has occurred, the callback should be run without 
  arguments or with an explicit `null` argument.
* `callback(err)` - A callback which is called when all `iterator` functions
  have finished, or an error occurs.

__Example__

```js
// Assume documents is an array of JSON objects and requestApi is a
// function that interacts with a rate-limited REST api.

async.eachLimit(documents, 20, requestApi, function(err){
    // if any of the saves produced an error, err would equal that error
});
```

---------------------------------------

<a name="map" />
### map(arr, iterator, callback)

Produces a new array of values by mapping each value in `arr` through
the `iterator` function. The `iterator` is called with an item from `arr` and a
callback for when it has finished processing. Each of these callback takes 2 arguments: 
an `error`, and the transformed item from `arr`. If `iterator` passes an error to his 
callback, the main `callback` (for the `map` function) is immediately called with the error.

Note, that since this function applies the `iterator` to each item in parallel,
there is no guarantee that the `iterator` functions will complete in order. 
However, the results array will be in the same order as the original `arr`.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err, transformed)` which must be called once 
  it has completed with an error (which can be `null`) and a transformed item.
* `callback(err, results)` - A callback which is called when all `iterator`
  functions have finished, or an error occurs. Results is an array of the
  transformed items from the `arr`.

__Example__

```js
async.map(['file1','file2','file3'], fs.stat, function(err, results){
    // results is now an array of stats for each file
});
```

---------------------------------------

<a name="mapSeries" />
### mapSeries(arr, iterator, callback)

The same as [`map`](#map), only the `iterator` is applied to each item in `arr` in
series. The next `iterator` is only called once the current one has completed. 
The results array will be in the same order as the original.


---------------------------------------

<a name="mapLimit" />
### mapLimit(arr, limit, iterator, callback)

The same as [`map`](#map), only no more than `limit` `iterator`s will be simultaneously 
running at any time.

Note that the items are not processed in batches, so there is no guarantee that 
the first `limit` `iterator` functions will complete before any others are started.

__Arguments__

* `arr` - An array to iterate over.
* `limit` - The maximum number of `iterator`s to run at any time.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err, transformed)` which must be called once 
  it has completed with an error (which can be `null`) and a transformed item.
* `callback(err, results)` - A callback which is called when all `iterator`
  calls have finished, or an error occurs. The result is an array of the
  transformed items from the original `arr`.

__Example__

```js
async.mapLimit(['file1','file2','file3'], 1, fs.stat, function(err, results){
    // results is now an array of stats for each file
});
```

---------------------------------------

<a name="select" />
<a name="filter" />
### filter(arr, iterator, callback)

__Alias:__ `select`

Returns a new array of all the values in `arr` which pass an async truth test.
_The callback for each `iterator` call only accepts a single argument of `true` or
`false`; it does not accept an error argument first!_ This is in-line with the
way node libraries work with truth tests like `fs.exists`. This operation is
performed in parallel, but the results array will be in the same order as the
original.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A truth test to apply to each item in `arr`.
  The `iterator` is passed a `callback(truthValue)`, which must be called with a 
  boolean argument once it has completed.
* `callback(results)` - A callback which is called after all the `iterator`
  functions have finished.

__Example__

```js
async.filter(['file1','file2','file3'], fs.exists, function(results){
    // results now equals an array of the existing files
});
```

---------------------------------------

<a name="selectSeries" />
<a name="filterSeries" />
### filterSeries(arr, iterator, callback)

__Alias:__ `selectSeries`

The same as [`filter`](#filter) only the `iterator` is applied to each item in `arr` in
series. The next `iterator` is only called once the current one has completed. 
The results array will be in the same order as the original.

---------------------------------------

<a name="reject" />
### reject(arr, iterator, callback)

The opposite of [`filter`](#filter). Removes values that pass an `async` truth test.

---------------------------------------

<a name="rejectSeries" />
### rejectSeries(arr, iterator, callback)

The same as [`reject`](#reject), only the `iterator` is applied to each item in `arr`
in series.


---------------------------------------

<a name="reduce" />
### reduce(arr, memo, iterator, callback)

__Aliases:__ `inject`, `foldl`

Reduces `arr` into a single value using an async `iterator` to return
each successive step. `memo` is the initial state of the reduction. 
This function only operates in series. 

For performance reasons, it may make sense to split a call to this function into 
a parallel map, and then use the normal `Array.prototype.reduce` on the results. 
This function is for situations where each step in the reduction needs to be async; 
if you can get the data before reducing it, then it's probably a good idea to do so.

__Arguments__

* `arr` - An array to iterate over.
* `memo` - The initial state of the reduction.
* `iterator(memo, item, callback)` - A function applied to each item in the
  array to produce the next step in the reduction. The `iterator` is passed a
  `callback(err, reduction)` which accepts an optional error as its first 
  argument, and the state of the reduction as the second. If an error is 
  passed to the callback, the reduction is stopped and the main `callback` is 
  immediately called with the error.
* `callback(err, result)` - A callback which is called after all the `iterator`
  functions have finished. Result is the reduced value.

__Example__

```js
async.reduce([1,2,3], 0, function(memo, item, callback){
    // pointless async:
    process.nextTick(function(){
        callback(null, memo + item)
    });
}, function(err, result){
    // result is now equal to the last value of memo, which is 6
});
```

---------------------------------------

<a name="reduceRight" />
### reduceRight(arr, memo, iterator, callback)

__Alias:__ `foldr`

Same as [`reduce`](#reduce), only operates on `arr` in reverse order.


---------------------------------------

<a name="detect" />
### detect(arr, iterator, callback)

Returns the first value in `arr` that passes an async truth test. The
`iterator` is applied in parallel, meaning the first iterator to return `true` will
fire the detect `callback` with that result. That means the result might not be
the first item in the original `arr` (in terms of order) that passes the test.

If order within the original `arr` is important, then look at [`detectSeries`](#detectSeries).

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A truth test to apply to each item in `arr`.
  The iterator is passed a `callback(truthValue)` which must be called with a 
  boolean argument once it has completed.
* `callback(result)` - A callback which is called as soon as any iterator returns
  `true`, or after all the `iterator` functions have finished. Result will be
  the first item in the array that passes the truth test (iterator) or the
  value `undefined` if none passed.

__Example__

```js
async.detect(['file1','file2','file3'], fs.exists, function(result){
    // result now equals the first file in the list that exists
});
```

---------------------------------------

<a name="detectSeries" />
### detectSeries(arr, iterator, callback)

The same as [`detect`](#detect), only the `iterator` is applied to each item in `arr`
in series. This means the result is always the first in the original `arr` (in
terms of array order) that passes the truth test.


---------------------------------------

<a name="sortBy" />
### sortBy(arr, iterator, callback)

Sorts a list by the results of running each `arr` value through an async `iterator`.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err, sortValue)` which must be called once it
  has completed with an error (which can be `null`) and a value to use as the sort
  criteria.
* `callback(err, results)` - A callback which is called after all the `iterator`
  functions have finished, or an error occurs. Results is the items from
  the original `arr` sorted by the values returned by the `iterator` calls.

__Example__

```js
async.sortBy(['file1','file2','file3'], function(file, callback){
    fs.stat(file, function(err, stats){
        callback(err, stats.mtime);
    });
}, function(err, results){
    // results is now the original array of files sorted by
    // modified date
});
```

__Sort Order__

By modifying the callback parameter the sorting order can be influenced:

```js
//ascending order
async.sortBy([1,9,3,5], function(x, callback){
    callback(null, x);
}, function(err,result){
    //result callback
} );

//descending order
async.sortBy([1,9,3,5], function(x, callback){
    callback(null, x*-1);    //<- x*-1 instead of x, turns the order around
}, function(err,result){
    //result callback
} );
```

---------------------------------------

<a name="some" />
### some(arr, iterator, callback)

__Alias:__ `any`

Returns `true` if at least one element in the `arr` satisfies an async test.
_The callback for each iterator call only accepts a single argument of `true` or
`false`; it does not accept an error argument first!_ This is in-line with the
way node libraries work with truth tests like `fs.exists`. Once any iterator
call returns `true`, the main `callback` is immediately called.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A truth test to apply to each item in the array
  in parallel. The iterator is passed a callback(truthValue) which must be 
  called with a boolean argument once it has completed.
* `callback(result)` - A callback which is called as soon as any iterator returns
  `true`, or after all the iterator functions have finished. Result will be
  either `true` or `false` depending on the values of the async tests.

__Example__

```js
async.some(['file1','file2','file3'], fs.exists, function(result){
    // if result is true then at least one of the files exists
});
```

---------------------------------------

<a name="every" />
### every(arr, iterator, callback)

__Alias:__ `all`

Returns `true` if every element in `arr` satisfies an async test.
_The callback for each `iterator` call only accepts a single argument of `true` or
`false`; it does not accept an error argument first!_ This is in-line with the
way node libraries work with truth tests like `fs.exists`.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A truth test to apply to each item in the array
  in parallel. The iterator is passed a callback(truthValue) which must be 
  called with a  boolean argument once it has completed.
* `callback(result)` - A callback which is called after all the `iterator`
  functions have finished. Result will be either `true` or `false` depending on
  the values of the async tests.

__Example__

```js
async.every(['file1','file2','file3'], fs.exists, function(result){
    // if result is true then every file exists
});
```

---------------------------------------

<a name="concat" />
### concat(arr, iterator, callback)

Applies `iterator` to each item in `arr`, concatenating the results. Returns the
concatenated list. The `iterator`s are called in parallel, and the results are
concatenated as they return. There is no guarantee that the results array will
be returned in the original order of `arr` passed to the `iterator` function.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err, results)` which must be called once it 
  has completed with an error (which can be `null`) and an array of results.
* `callback(err, results)` - A callback which is called after all the `iterator`
  functions have finished, or an error occurs. Results is an array containing
  the concatenated results of the `iterator` function.

__Example__

```js
async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files){
    // files is now a list of filenames that exist in the 3 directories
});
```

---------------------------------------

<a name="concatSeries" />
### concatSeries(arr, iterator, callback)

Same as [`concat`](#concat), but executes in series instead of parallel.


## Control Flow

<a name="series" />
### series(tasks, [callback])

Run the functions in the `tasks` array in series, each one running once the previous
function has completed. If any functions in the series pass an error to its
callback, no more functions are run, and `callback` is immediately called with the value of the error. 
Otherwise, `callback` receives an array of results when `tasks` have completed.

It is also possible to use an object instead of an array. Each property will be
run as a function, and the results will be passed to the final `callback` as an object
instead of an array. This can be a more readable way of handling results from
[`series`](#series).

**Note** that while many implementations preserve the order of object properties, the
[ECMAScript Language Specifcation](http://www.ecma-international.org/ecma-262/5.1/#sec-8.6) 
explicitly states that

> The mechanics and order of enumerating the properties is not specified.

So if you rely on the order in which your series of functions are executed, and want
this to work on all platforms, consider using an array. 

__Arguments__

* `tasks` - An array or object containing functions to run, each function is passed
  a `callback(err, result)` it must call on completion with an error `err` (which can
  be `null`) and an optional `result` value.
* `callback(err, results)` - An optional callback to run once all the functions
  have completed. This function gets a results array (or object) containing all 
  the result arguments passed to the `task` callbacks.

__Example__

```js
async.series([
    function(callback){
        // do some stuff ...
        callback(null, 'one');
    },
    function(callback){
        // do some more stuff ...
        callback(null, 'two');
    }
],
// optional callback
function(err, results){
    // results is now equal to ['one', 'two']
});


// an example using an object instead of an array
async.series({
    one: function(callback){
        setTimeout(function(){
            callback(null, 1);
        }, 200);
    },
    two: function(callback){
        setTimeout(function(){
            callback(null, 2);
        }, 100);
    }
},
function(err, results) {
    // results is now equal to: {one: 1, two: 2}
});
```

---------------------------------------

<a name="parallel" />
### parallel(tasks, [callback])

Run the `tasks` array of functions in parallel, without waiting until the previous
function has completed. If any of the functions pass an error to its
callback, the main `callback` is immediately called with the value of the error.
Once the `tasks` have completed, the results are passed to the final `callback` as an
array.

It is also possible to use an object instead of an array. Each property will be
run as a function and the results will be passed to the final `callback` as an object
instead of an array. This can be a more readable way of handling results from
[`parallel`](#parallel).


__Arguments__

* `tasks` - An array or object containing functions to run. Each function is passed 
  a `callback(err, result)` which it must call on completion with an error `err` 
  (which can be `null`) and an optional `result` value.
* `callback(err, results)` - An optional callback to run once all the functions
  have completed. This function gets a results array (or object) containing all 
  the result arguments passed to the task callbacks.

__Example__

```js
async.parallel([
    function(callback){
        setTimeout(function(){
            callback(null, 'one');
        }, 200);
    },
    function(callback){
        setTimeout(function(){
            callback(null, 'two');
        }, 100);
    }
],
// optional callback
function(err, results){
    // the results array will equal ['one','two'] even though
    // the second function had a shorter timeout.
});


// an example using an object instead of an array
async.parallel({
    one: function(callback){
        setTimeout(function(){
            callback(null, 1);
        }, 200);
    },
    two: function(callback){
        setTimeout(function(){
            callback(null, 2);
        }, 100);
    }
},
function(err, results) {
    // results is now equals to: {one: 1, two: 2}
});
```

---------------------------------------

<a name="parallelLimit" />
### parallelLimit(tasks, limit, [callback])

The same as [`parallel`](#parallel), only `tasks` are executed in parallel 
with a maximum of `limit` tasks executing at any time.

Note that the `tasks` are not executed in batches, so there is no guarantee that 
the first `limit` tasks will complete before any others are started.

__Arguments__

* `tasks` - An array or object containing functions to run, each function is passed 
  a `callback(err, result)` it must call on completion with an error `err` (which can
  be `null`) and an optional `result` value.
* `limit` - The maximum number of `tasks` to run at any time.
* `callback(err, results)` - An optional callback to run once all the functions
  have completed. This function gets a results array (or object) containing all 
  the result arguments passed to the `task` callbacks.

---------------------------------------

<a name="whilst" />
### whilst(test, fn, callback)

Repeatedly call `fn`, while `test` returns `true`. Calls `callback` when stopped,
or an error occurs.

__Arguments__

* `test()` - synchronous truth test to perform before each execution of `fn`.
* `fn(callback)` - A function which is called each time `test` passes. The function is
  passed a `callback(err)`, which must be called once it has completed with an 
  optional `err` argument.
* `callback(err)` - A callback which is called after the test fails and repeated
  execution of `fn` has stopped.

__Example__

```js
var count = 0;

async.whilst(
    function () { return count < 5; },
    function (callback) {
        count++;
        setTimeout(callback, 1000);
    },
    function (err) {
        // 5 seconds have passed
    }
);
```

---------------------------------------

<a name="doWhilst" />
### doWhilst(fn, test, callback)

The post-check version of [`whilst`](#whilst). To reflect the difference in 
the order of operations, the arguments `test` and `fn` are switched. 

`doWhilst` is to `whilst` as `do while` is to `while` in plain JavaScript.

---------------------------------------

<a name="until" />
### until(test, fn, callback)

Repeatedly call `fn` until `test` returns `true`. Calls `callback` when stopped,
or an error occurs.

The inverse of [`whilst`](#whilst).

---------------------------------------

<a name="doUntil" />
### doUntil(fn, test, callback)

Like [`doWhilst`](#doWhilst), except the `test` is inverted. Note the argument ordering differs from `until`.

---------------------------------------

<a name="forever" />
### forever(fn, errback)

Calls the asynchronous function `fn` with a callback parameter that allows it to
call itself again, in series, indefinitely.

If an error is passed to the callback then `errback` is called with the
error, and execution stops, otherwise it will never be called.

```js
async.forever(
    function(next) {
        // next is suitable for passing to things that need a callback(err [, whatever]);
        // it will result in this function being called again.
    },
    function(err) {
        // if next is called with a value in its first parameter, it will appear
        // in here as 'err', and execution will stop.
    }
);
```

---------------------------------------

<a name="waterfall" />
### waterfall(tasks, [callback])

Runs the `tasks` array of functions in series, each passing their results to the next in
the array. However, if any of the `tasks` pass an error to their own callback, the
next function is not executed, and the main `callback` is immediately called with
the error.

__Arguments__

* `tasks` - An array of functions to run, each function is passed a 
  `callback(err, result1, result2, ...)` it must call on completion. The first
  argument is an error (which can be `null`) and any further arguments will be 
  passed as arguments in order to the next task.
* `callback(err, [results])` - An optional callback to run once all the functions
  have completed. This will be passed the results of the last task's callback.



__Example__

```js
async.waterfall([
    function(callback) {
        callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback) {
      // arg1 now equals 'one' and arg2 now equals 'two'
        callback(null, 'three');
    },
    function(arg1, callback) {
        // arg1 now equals 'three'
        callback(null, 'done');
    }
], function (err, result) {
    // result now equals 'done'    
});
```

---------------------------------------
<a name="compose" />
### compose(fn1, fn2...)

Creates a function which is a composition of the passed asynchronous
functions. Each function consumes the return value of the function that
follows. Composing functions `f()`, `g()`, and `h()` would produce the result of
`f(g(h()))`, only this version uses callbacks to obtain the return values.

Each function is executed with the `this` binding of the composed function.

__Arguments__

* `functions...` - the asynchronous functions to compose


__Example__

```js
function add1(n, callback) {
    setTimeout(function () {
        callback(null, n + 1);
    }, 10);
}

function mul3(n, callback) {
    setTimeout(function () {
        callback(null, n * 3);
    }, 10);
}

var add1mul3 = async.compose(mul3, add1);

add1mul3(4, function (err, result) {
   // result now equals 15
});
```

---------------------------------------
<a name="seq" />
### seq(fn1, fn2...)

Version of the compose function that is more natural to read.
Each function consumes the return value of the previous function.
It is the equivalent of [`compose`](#compose) with the arguments reversed.

Each function is executed with the `this` binding of the composed function.

__Arguments__

* functions... - the asynchronous functions to compose


__Example__

```js
// Requires lodash (or underscore), express3 and dresende's orm2.
// Part of an app, that fetches cats of the logged user.
// This example uses `seq` function to avoid overnesting and error 
// handling clutter.
app.get('/cats', function(request, response) {
  var User = request.models.User;
  async.seq(
    _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))
    function(user, fn) {
      user.getCats(fn);      // 'getCats' has signature (callback(err, data))
    }
  )(req.session.user_id, function (err, cats) {
    if (err) {
      console.error(err);
      response.json({ status: 'error', message: err.message });
    } else {
      response.json({ status: 'ok', message: 'Cats found', data: cats });
    }
  });
});
```

---------------------------------------
<a name="applyEach" />
### applyEach(fns, args..., callback)

Applies the provided arguments to each function in the array, calling 
`callback` after all functions have completed. If you only provide the first
argument, then it will return a function which lets you pass in the
arguments as if it were a single function call.

__Arguments__

* `fns` - the asynchronous functions to all call with the same arguments
* `args...` - any number of separate arguments to pass to the function
* `callback` - the final argument should be the callback, called when all
  functions have completed processing


__Example__

```js
async.applyEach([enableSearch, updateSchema], 'bucket', callback);

// partial application example:
async.each(
    buckets,
    async.applyEach([enableSearch, updateSchema]),
    callback
);
```

---------------------------------------

<a name="applyEachSeries" />
### applyEachSeries(arr, iterator, callback)

The same as [`applyEach`](#applyEach) only the functions are applied in series.

---------------------------------------

<a name="queue" />
### queue(worker, concurrency)

Creates a `queue` object with the specified `concurrency`. Tasks added to the
`queue` are processed in parallel (up to the `concurrency` limit). If all
`worker`s are in progress, the task is queued until one becomes available. 
Once a `worker` completes a `task`, that `task`'s callback is called.

__Arguments__

* `worker(task, callback)` - An asynchronous function for processing a queued
  task, which must call its `callback(err)` argument when finished, with an 
  optional `error` as an argument.
* `concurrency` - An `integer` for determining how many `worker` functions should be
  run in parallel.

__Queue objects__

The `queue` object returned by this function has the following properties and
methods:

* `length()` - a function returning the number of items waiting to be processed.
* `started` - a function returning whether or not any items have been pushed and processed by the queue
* `running()` - a function returning the number of items currently being processed.
* `idle()` - a function returning false if there are items waiting or being processed, or true if not.
* `concurrency` - an integer for determining how many `worker` functions should be
  run in parallel. This property can be changed after a `queue` is created to
  alter the concurrency on-the-fly.
* `push(task, [callback])` - add a new task to the `queue`. Calls `callback` once 
  the `worker` has finished processing the task. Instead of a single task, a `tasks` array
  can be submitted. The respective callback is used for every task in the list.
* `unshift(task, [callback])` - add a new task to the front of the `queue`.
* `saturated` - a callback that is called when the `queue` length hits the `concurrency` limit, 
   and further tasks will be queued.
* `empty` - a callback that is called when the last item from the `queue` is given to a `worker`.
* `drain` - a callback that is called when the last item from the `queue` has returned from the `worker`.
* `paused` - a boolean for determining whether the queue is in a paused state
* `pause()` - a function that pauses the processing of tasks until `resume()` is called.
* `resume()` - a function that resumes the processing of queued tasks when the queue is paused.
* `kill()` - a function that removes the `drain` callback and empties remaining tasks from the queue forcing it to go idle.

__Example__

```js
// create a queue object with concurrency 2

var q = async.queue(function (task, callback) {
    console.log('hello ' + task.name);
    callback();
}, 2);


// assign a callback
q.drain = function() {
    console.log('all items have been processed');
}

// add some items to the queue

q.push({name: 'foo'}, function (err) {
    console.log('finished processing foo');
});
q.push({name: 'bar'}, function (err) {
    console.log('finished processing bar');
});

// add some items to the queue (batch-wise)

q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function (err) {
    console.log('finished processing item');
});

// add some items to the front of the queue

q.unshift({name: 'bar'}, function (err) {
    console.log('finished processing bar');
});
```


---------------------------------------

<a name="priorityQueue" />
### priorityQueue(worker, concurrency)

The same as [`queue`](#queue) only tasks are assigned a priority and completed in ascending priority order. There are two differences between `queue` and `priorityQueue` objects:

* `push(task, priority, [callback])` - `priority` should be a number. If an array of
  `tasks` is given, all tasks will be assigned the same priority.
* The `unshift` method was removed.

---------------------------------------

<a name="cargo" />
### cargo(worker, [payload])

Creates a `cargo` object with the specified payload. Tasks added to the
cargo will be processed altogether (up to the `payload` limit). If the
`worker` is in progress, the task is queued until it becomes available. Once
the `worker` has completed some tasks, each callback of those tasks is called.
Check out [this animation](https://camo.githubusercontent.com/6bbd36f4cf5b35a0f11a96dcd2e97711ffc2fb37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130382f62626330636662302d356632392d313165322d393734662d3333393763363464633835382e676966) for how `cargo` and `queue` work.

While [queue](#queue) passes only one task to one of a group of workers
at a time, cargo passes an array of tasks to a single worker, repeating
when the worker is finished.

__Arguments__

* `worker(tasks, callback)` - An asynchronous function for processing an array of
  queued tasks, which must call its `callback(err)` argument when finished, with 
  an optional `err` argument.
* `payload` - An optional `integer` for determining how many tasks should be
  processed per round; if omitted, the default is unlimited.

__Cargo objects__

The `cargo` object returned by this function has the following properties and
methods:

* `length()` - A function returning the number of items waiting to be processed.
* `payload` - An `integer` for determining how many tasks should be
  process per round. This property can be changed after a `cargo` is created to
  alter the payload on-the-fly.
* `push(task, [callback])` - Adds `task` to the `queue`. The callback is called
  once the `worker` has finished processing the task. Instead of a single task, an array of `tasks` 
  can be submitted. The respective callback is used for every task in the list.
* `saturated` - A callback that is called when the `queue.length()` hits the concurrency and further tasks will be queued.
* `empty` - A callback that is called when the last item from the `queue` is given to a `worker`.
* `drain` - A callback that is called when the last item from the `queue` has returned from the `worker`.

__Example__

```js
// create a cargo object with payload 2

var cargo = async.cargo(function (tasks, callback) {
    for(var i=0; i<tasks.length; i++){
      console.log('hello ' + tasks[i].name);
    }
    callback();
}, 2);


// add some items

cargo.push({name: 'foo'}, function (err) {
    console.log('finished processing foo');
});
cargo.push({name: 'bar'}, function (err) {
    console.log('finished processing bar');
});
cargo.push({name: 'baz'}, function (err) {
    console.log('finished processing baz');
});
```

---------------------------------------

<a name="auto" />
### auto(tasks, [callback])

Determines the best order for running the functions in `tasks`, based on their 
requirements. Each function can optionally depend on other functions being completed 
first, and each function is run as soon as its requirements are satisfied. 

If any of the functions pass an error to their callback, it will not 
complete (so any other functions depending on it will not run), and the main 
`callback` is immediately called with the error. Functions also receive an 
object containing the results of functions which have completed so far.

Note, all functions are called with a `results` object as a second argument, 
so it is unsafe to pass functions in the `tasks` object which cannot handle the
extra argument. 

For example, this snippet of code:

```js
async.auto({
  readData: async.apply(fs.readFile, 'data.txt', 'utf-8')
}, callback);
```

will have the effect of calling `readFile` with the results object as the last
argument, which will fail:

```js
fs.readFile('data.txt', 'utf-8', cb, {});
```

Instead, wrap the call to `readFile` in a function which does not forward the 
`results` object:

```js
async.auto({
  readData: function(cb, results){
    fs.readFile('data.txt', 'utf-8', cb);
  }
}, callback);
```

__Arguments__

* `tasks` - An object. Each of its properties is either a function or an array of
  requirements, with the function itself the last item in the array. The object's key
  of a property serves as the name of the task defined by that property,
  i.e. can be used when specifying requirements for other tasks.
  The function receives two arguments: (1) a `callback(err, result)` which must be 
  called when finished, passing an `error` (which can be `null`) and the result of 
  the function's execution, and (2) a `results` object, containing the results of
  the previously executed functions.
* `callback(err, results)` - An optional callback which is called when all the
  tasks have been completed. It receives the `err` argument if any `tasks` 
  pass an error to their callback. Results are always returned; however, if 
  an error occurs, no further `tasks` will be performed, and the results
  object will only contain partial results.


__Example__

```js
async.auto({
    get_data: function(callback){
        console.log('in get_data');
        // async code to get some data
        callback(null, 'data', 'converted to array');
    },
    make_folder: function(callback){
        console.log('in make_folder');
        // async code to create a directory to store a file in
        // this is run at the same time as getting the data
        callback(null, 'folder');
    },
    write_file: ['get_data', 'make_folder', function(callback, results){
        console.log('in write_file', JSON.stringify(results));
        // once there is some data and the directory exists,
        // write the data to a file in the directory
        callback(null, 'filename');
    }],
    email_link: ['write_file', function(callback, results){
        console.log('in email_link', JSON.stringify(results));
        // once the file is written let's email a link to it...
        // results.write_file contains the filename returned by write_file.
        callback(null, {'file':results.write_file, 'email':'user@example.com'});
    }]
}, function(err, results) {
    console.log('err = ', err);
    console.log('results = ', results);
});
```

This is a fairly trivial example, but to do this using the basic parallel and
series functions would look like this:

```js
async.parallel([
    function(callback){
        console.log('in get_data');
        // async code to get some data
        callback(null, 'data', 'converted to array');
    },
    function(callback){
        console.log('in make_folder');
        // async code to create a directory to store a file in
        // this is run at the same time as getting the data
        callback(null, 'folder');
    }
],
function(err, results){
    async.series([
        function(callback){
            console.log('in write_file', JSON.stringify(results));
            // once there is some data and the directory exists,
            // write the data to a file in the directory
            results.push('filename');
            callback(null);
        },
        function(callback){
            console.log('in email_link', JSON.stringify(results));
            // once the file is written let's email a link to it...
            callback(null, {'file':results.pop(), 'email':'user@example.com'});
        }
    ]);
});
```

For a complicated series of `async` tasks, using the [`auto`](#auto) function makes adding
new tasks much easier (and the code more readable).


---------------------------------------

<a name="retry" />
### retry([times = 5], task, [callback])

Attempts to get a successful response from `task` no more than `times` times before
returning an error. If the task is successful, the `callback` will be passed the result
of the successful task. If all attempts fail, the callback will be passed the error and
result (if any) of the final attempt.

__Arguments__

* `times` - An integer indicating how many times to attempt the `task` before giving up. Defaults to 5.
* `task(callback, results)` - A function which receives two arguments: (1) a `callback(err, result)`
  which must be called when finished, passing `err` (which can be `null`) and the `result` of 
  the function's execution, and (2) a `results` object, containing the results of
  the previously executed functions (if nested inside another control flow).
* `callback(err, results)` - An optional callback which is called when the
  task has succeeded, or after the final failed attempt. It receives the `err` and `result` arguments of the last attempt at completing the `task`.

The [`retry`](#retry) function can be used as a stand-alone control flow by passing a
callback, as shown below:

```js
async.retry(3, apiMethod, function(err, result) {
    // do something with the result
});
```

It can also be embeded within other control flow functions to retry individual methods
that are not as reliable, like this:

```js
async.auto({
    users: api.getUsers.bind(api),
    payments: async.retry(3, api.getPayments.bind(api))
}, function(err, results) {
  // do something with the results
});
```


---------------------------------------

<a name="iterator" />
### iterator(tasks)

Creates an iterator function which calls the next function in the `tasks` array,
returning a continuation to call the next one after that. It's also possible to
“peek” at the next iterator with `iterator.next()`.

This function is used internally by the `async` module, but can be useful when
you want to manually control the flow of functions in series.

__Arguments__

* `tasks` - An array of functions to run.

__Example__

```js
var iterator = async.iterator([
    function(){ sys.p('one'); },
    function(){ sys.p('two'); },
    function(){ sys.p('three'); }
]);

node> var iterator2 = iterator();
'one'
node> var iterator3 = iterator2();
'two'
node> iterator3();
'three'
node> var nextfn = iterator2.next();
node> nextfn();
'three'
```

---------------------------------------

<a name="apply" />
### apply(function, arguments..)

Creates a continuation function with some arguments already applied. 

Useful as a shorthand when combined with other control flow functions. Any arguments
passed to the returned function are added to the arguments originally passed
to apply.

__Arguments__

* `function` - The function you want to eventually apply all arguments to.
* `arguments...` - Any number of arguments to automatically apply when the
  continuation is called.

__Example__

```js
// using apply

async.parallel([
    async.apply(fs.writeFile, 'testfile1', 'test1'),
    async.apply(fs.writeFile, 'testfile2', 'test2'),
]);


// the same process without using apply

async.parallel([
    function(callback){
        fs.writeFile('testfile1', 'test1', callback);
    },
    function(callback){
        fs.writeFile('testfile2', 'test2', callback);
    }
]);
```

It's possible to pass any number of additional arguments when calling the
continuation:

```js
node> var fn = async.apply(sys.puts, 'one');
node> fn('two', 'three');
one
two
three
```

---------------------------------------

<a name="nextTick" />
### nextTick(callback), setImmediate(callback)

Calls `callback` on a later loop around the event loop. In Node.js this just
calls `process.nextTick`; in the browser it falls back to `setImmediate(callback)`
if available, otherwise `setTimeout(callback, 0)`, which means other higher priority
events may precede the execution of `callback`.

This is used internally for browser-compatibility purposes.

__Arguments__

* `callback` - The function to call on a later loop around the event loop.

__Example__

```js
var call_order = [];
async.nextTick(function(){
    call_order.push('two');
    // call_order now equals ['one','two']
});
call_order.push('one')
```

<a name="times" />
### times(n, callback)

Calls the `callback` function `n` times, and accumulates results in the same manner
you would use with [`map`](#map).

__Arguments__

* `n` - The number of times to run the function.
* `callback` - The function to call `n` times.

__Example__

```js
// Pretend this is some complicated async factory
var createUser = function(id, callback) {
  callback(null, {
    id: 'user' + id
  })
}
// generate 5 users
async.times(5, function(n, next){
    createUser(n, function(err, user) {
      next(err, user)
    })
}, function(err, users) {
  // we should now have 5 users
});
```

<a name="timesSeries" />
### timesSeries(n, callback)

The same as [`times`](#times), only the iterator is applied to each item in `arr` in
series. The next `iterator` is only called once the current one has completed. 
The results array will be in the same order as the original.


## Utils

<a name="memoize" />
### memoize(fn, [hasher])

Caches the results of an `async` function. When creating a hash to store function
results against, the callback is omitted from the hash and an optional hash
function can be used.

The cache of results is exposed as the `memo` property of the function returned
by `memoize`.

__Arguments__

* `fn` - The function to proxy and cache results from.
* `hasher` - Tn optional function for generating a custom hash for storing
  results. It has all the arguments applied to it apart from the callback, and
  must be synchronous.

__Example__

```js
var slow_fn = function (name, callback) {
    // do something
    callback(null, result);
};
var fn = async.memoize(slow_fn);

// fn can now be used as if it were slow_fn
fn('some name', function () {
    // callback
});
```

<a name="unmemoize" />
### unmemoize(fn)

Undoes a [`memoize`](#memoize)d function, reverting it to the original, unmemoized
form. Handy for testing.

__Arguments__

* `fn` - the memoized function

<a name="log" />
### log(function, arguments)

Logs the result of an `async` function to the `console`. Only works in Node.js or
in browsers that support `console.log` and `console.error` (such as FF and Chrome).
If multiple arguments are returned from the async function, `console.log` is
called on each argument in order.

__Arguments__

* `function` - The function you want to eventually apply all arguments to.
* `arguments...` - Any number of arguments to apply to the function.

__Example__

```js
var hello = function(name, callback){
    setTimeout(function(){
        callback(null, 'hello ' + name);
    }, 1000);
};
```
```js
node> async.log(hello, 'world');
'hello world'
```

---------------------------------------

<a name="dir" />
### dir(function, arguments)

Logs the result of an `async` function to the `console` using `console.dir` to
display the properties of the resulting object. Only works in Node.js or
in browsers that support `console.dir` and `console.error` (such as FF and Chrome).
If multiple arguments are returned from the async function, `console.dir` is
called on each argument in order.

__Arguments__

* `function` - The function you want to eventually apply all arguments to.
* `arguments...` - Any number of arguments to apply to the function.

__Example__

```js
var hello = function(name, callback){
    setTimeout(function(){
        callback(null, {hello: name});
    }, 1000);
};
```
```js
node> async.dir(hello, 'world');
{hello: 'world'}
```

---------------------------------------

<a name="noConflict" />
### noConflict()

Changes the value of `async` back to its original value, returning a reference to the
`async` object.
