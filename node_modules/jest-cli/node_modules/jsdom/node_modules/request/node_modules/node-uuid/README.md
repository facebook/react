# node-uuid

Simple, fast generation of [RFC4122](http://www.ietf.org/rfc/rfc4122.txt) UUIDS.

Features:

* Generate RFC4122 version 1 or version 4 UUIDs
* Runs in node.js and all browsers.
* Registered as a [ComponentJS](https://github.com/component/component) [component](https://github.com/component/component/wiki/Components) ('broofa/node-uuid').
* Cryptographically strong random # generation on supporting platforms
* 1.1K minified and gzip'ed  (Want something smaller?  Check this [crazy shit](https://gist.github.com/982883) out! )
* [Annotated source code](http://broofa.github.com/node-uuid/docs/uuid.html)
* Comes with a Command Line Interface for generating uuids on the command line

## Getting Started

Install it in your browser:

```html
<script src="uuid.js"></script>
```

Or in node.js:

```
npm install node-uuid
```

```javascript
var uuid = require('node-uuid');
```

Then create some ids ...

```javascript
// Generate a v1 (time-based) id
uuid.v1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'

// Generate a v4 (random) id
uuid.v4(); // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1'
```

## API

### uuid.v1([`options` [, `buffer` [, `offset`]]])

Generate and return a RFC4122 v1 (timestamp-based) UUID.

* `options` - (Object) Optional uuid state to apply. Properties may include:

  * `node` - (Array) Node id as Array of 6 bytes (per 4.1.6). Default: Randomly generated ID.  See note 1.
  * `clockseq` - (Number between 0 - 0x3fff) RFC clock sequence.  Default: An internally maintained clockseq is used.
  * `msecs` - (Number | Date) Time in milliseconds since unix Epoch.  Default: The current time is used.
  * `nsecs` - (Number between 0-9999) additional time, in 100-nanosecond units. Ignored if `msecs` is unspecified. Default: internal uuid counter is used, as per 4.2.1.2.

* `buffer` - (Array | Buffer) Array or buffer where UUID bytes are to be written.
* `offset` - (Number) Starting index in `buffer` at which to begin writing.

Returns `buffer`, if specified, otherwise the string form of the UUID

Notes:

1. The randomly generated node id is only guaranteed to stay constant for the lifetime of the current JS runtime. (Future versions of this module may use persistent storage mechanisms to extend this guarantee.)

Example: Generate string UUID with fully-specified options

```javascript
uuid.v1({
  node: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab],
  clockseq: 0x1234,
  msecs: new Date('2011-11-01').getTime(),
  nsecs: 5678
});   // -> "710b962e-041c-11e1-9234-0123456789ab"
```

Example: In-place generation of two binary IDs

```javascript
// Generate two ids in an array
var arr = new Array(32); // -> []
uuid.v1(null, arr, 0);   // -> [02 a2 ce 90 14 32 11 e1 85 58 0b 48 8e 4f c1 15]
uuid.v1(null, arr, 16);  // -> [02 a2 ce 90 14 32 11 e1 85 58 0b 48 8e 4f c1 15 02 a3 1c b0 14 32 11 e1 85 58 0b 48 8e 4f c1 15]

// Optionally use uuid.unparse() to get stringify the ids
uuid.unparse(buffer);    // -> '02a2ce90-1432-11e1-8558-0b488e4fc115'
uuid.unparse(buffer, 16) // -> '02a31cb0-1432-11e1-8558-0b488e4fc115'
```

### uuid.v4([`options` [, `buffer` [, `offset`]]])

Generate and return a RFC4122 v4 UUID.

* `options` - (Object) Optional uuid state to apply. Properties may include:

  * `random` - (Number[16]) Array of 16 numbers (0-255) to use in place of randomly generated values
  * `rng` - (Function) Random # generator to use.  Set to one of the built-in generators - `uuid.mathRNG` (all platforms), `uuid.nodeRNG` (node.js only), `uuid.whatwgRNG` (WebKit only) - or a custom function that returns an array[16] of byte values.

* `buffer` - (Array | Buffer) Array or buffer where UUID bytes are to be written.
* `offset` - (Number) Starting index in `buffer` at which to begin writing.

Returns `buffer`, if specified, otherwise the string form of the UUID

Example: Generate string UUID with fully-specified options

```javascript
uuid.v4({
  random: [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
  ]
});
// -> "109156be-c4fb-41ea-b1b4-efe1671c5836"
```

Example: Generate two IDs in a single buffer

```javascript
var buffer = new Array(32); // (or 'new Buffer' in node.js)
uuid.v4(null, buffer, 0);
uuid.v4(null, buffer, 16);
```

### uuid.parse(id[, buffer[, offset]])
### uuid.unparse(buffer[, offset])

Parse and unparse UUIDs

  * `id` - (String) UUID(-like) string
  * `buffer` - (Array | Buffer) Array or buffer where UUID bytes are to be written. Default: A new Array or Buffer is used
  * `offset` - (Number) Starting index in `buffer` at which to begin writing. Default: 0

Example parsing and unparsing a UUID string

```javascript
var bytes = uuid.parse('797ff043-11eb-11e1-80d6-510998755d10'); // -> <Buffer 79 7f f0 43 11 eb 11 e1 80 d6 51 09 98 75 5d 10>
var string = uuid.unparse(bytes); // -> '797ff043-11eb-11e1-80d6-510998755d10'
```

### uuid.noConflict()

(Browsers only) Set `uuid` property back to it's previous value.

Returns the node-uuid object.

Example:

```javascript
var myUuid = uuid.noConflict();
myUuid.v1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
```

## Deprecated APIs

Support for the following v1.2 APIs is available in v1.3, but is deprecated and will be removed in the next major version.

### uuid([format [, buffer [, offset]]])

uuid() has become uuid.v4(), and the `format` argument is now implicit in the `buffer` argument. (i.e. if you specify a buffer, the format is assumed to be binary).

### uuid.BufferClass

The class of container created when generating binary uuid data if no buffer argument is specified.  This is expected to go away, with no replacement API.

## Command Line Interface

To use the executable, it's probably best to install this library globally.

`npm install -g node-uuid`

Usage:

```
USAGE: uuid [version] [options]


options:

--help                     Display this message and exit
```

`version` must be an RFC4122 version that is supported by this library, which is currently version 1 and version 4 (denoted by "v1" and "v4", respectively). `version` defaults to version 4 when not supplied.

### Examples

```
> uuid
3a91f950-dec8-4688-ba14-5b7bbfc7a563
```

```
> uuid v1
9d0b43e0-7696-11e3-964b-250efa37a98e
```

```
> uuid v4
6790ac7c-24ac-4f98-8464-42f6d98a53ae
```

## Testing

In node.js

```
npm test
```

In Browser

```
open test/test.html
```

### Benchmarking

Requires node.js

```
npm install uuid uuid-js
node benchmark/benchmark.js
```

For a more complete discussion of node-uuid performance, please see the `benchmark/README.md` file, and the [benchmark wiki](https://github.com/broofa/node-uuid/wiki/Benchmark)

For browser performance [checkout the JSPerf tests](http://jsperf.com/node-uuid-performance).

## Release notes

### 1.4.0

* Improved module context detection
* Removed public RNG functions

### 1.3.2

* Improve tests and handling of v1() options (Issue #24)
* Expose RNG option to allow for perf testing with different generators

### 1.3.0

* Support for version 1 ids, thanks to [@ctavan](https://github.com/ctavan)!
* Support for node.js crypto API
* De-emphasizing performance in favor of a) cryptographic quality PRNGs where available and b) more manageable code
