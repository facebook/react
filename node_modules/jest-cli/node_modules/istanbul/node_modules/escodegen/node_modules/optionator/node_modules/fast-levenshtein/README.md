# fast-levenshtein - Levenshtein algorithm in Javascript

[![Build Status](https://secure.travis-ci.org/hiddentao/fast-levenshtein.png)](http://travis-ci.org/hiddentao/fast-levenshtein)

An efficient Javascript implementation of the [Levenshtein algorithm](http://en.wikipedia.org/wiki/Levenshtein_distance) with asynchronous callback support.

## Features

* Works in node.js and in the browser.
* Better performance than other implementations by not needing to store the whole matrix ([more info](http://www.codeproject.com/Articles/13525/Fast-memory-efficient-Levenshtein-algorithm)).
* Provides synchronous and asynchronous versions of the algorithm.
* Asynchronous version is almost as fast as the synchronous version for small strings and can also provide progress updates.
* Comprehensive test suite and performance benchmark.
* Small: <1 KB minified and gzipped

## Installation

### node.js

Install using [npm](http://npmjs.org/):

```bash
$ npm install fast-levenshtein
```

### Browser

Using bower:

```bash
$ bower install fast-levenshtein
```

If you are not using any module loader system then the API will then be accessible via the `window.Levenshtein` object.

## Examples

**Synchronous**

```javascript
var levenshtein = require('fast-levenshtein');

var distance = levenshtein.get('back', 'book');   // 2
var distance = levenshtein.get('我愛你', '我叫你');   // 1
```

**Asynchronous**

```javascript
var levenshtein = require('fast-levenshtein');

levenshtein.getAsync('back', 'book', function (err, distance) {
  // err is null unless an error was thrown
  // distance equals 2
});
```

**Asynchronous with progress updates**

```javascript
var levenshtein = require('fast-levenshtein');

var hugeText1 = fs.readFileSync(...);
var hugeText2 = fs.readFileSync(...);

levenshtein.getAsync(hugeText1, hugeText2, function (err, distance) {
  // process the results as normal
}, {
  progress: function(percentComplete) {
    console.log(percentComplete + ' % completed so far...');
  }
);
```

## Building and Testing

To build the code and run the tests:

```bash
$ npm install -g grunt-cli
$ npm install
$ npm run build
```

## Performance

_Thanks to [Titus Wormer](https://github.com/wooorm) for [encouraging me](https://github.com/hiddentao/fast-levenshtein/issues/1) to do this._

Benchmarked against other node.js levenshtein distance modules (on Macbook Air 2012, Core i7, 8GB RAM):

```bash
Running suite Implementation comparison [benchmark/speed.js]...
>> levenshtein-edit-distance x 234 ops/sec ±3.02% (73 runs sampled)
>> levenshtein-component x 422 ops/sec ±4.38% (83 runs sampled)
>> levenshtein-deltas x 283 ops/sec ±3.83% (78 runs sampled)
>> natural x 255 ops/sec ±0.76% (88 runs sampled)
>> levenshtein x 180 ops/sec ±3.55% (86 runs sampled)
>> fast-levenshtein x 1,792 ops/sec ±2.72% (95 runs sampled)
Benchmark done.
Fastest test is fast-levenshtein at 4.2x faster than levenshtein-component
```

You can run this benchmark yourself by doing:

```bash
$ npm install -g grunt-cli
$ npm install
$ npm run build
$ npm run benchmark
```

## Contributing

If you wish to submit a pull request please update and/or create new tests for any changes you make and ensure the grunt build passes.

See [CONTRIBUTING.md](https://github.com/hiddentao/fast-levenshtein/blob/master/CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE.md](https://github.com/hiddentao/fast-levenshtein/blob/master/LICENSE.md)
