# is-iojs

is-iojs determines if runtime is io.js.

## Installation

    $ npm install is-iojs

## Quick start

First you need to integrate is-iojs into your application:

```javascript
var isIojs = require('is-iojs');
```

Then you can use `isIojs` to determine whether the runtime is io.js or not. If it's `true`, the platform is io.js:

```javascript
if (isIojs) {
  console.log('io.js');
} else {
  console.log('not io.js');
}
```

## Running the tests

Just clone this repository, install its dependencies and run `npm test` command:

    $ git clone https://github.com/alexpods/is-iojs
    $ cd is-iojs
    $ npm install
    $ npm test

## License

The MIT License (MIT)
Copyright (c) 2015 Aleksey Podskrebyshev, Golo Roden.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
