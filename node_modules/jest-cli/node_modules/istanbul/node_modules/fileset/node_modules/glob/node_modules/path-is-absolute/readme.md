# path-is-absolute [![Build Status](https://travis-ci.org/sindresorhus/path-is-absolute.svg?branch=master)](https://travis-ci.org/sindresorhus/path-is-absolute)

> Node.js 0.12 [`path.isAbsolute()`](http://nodejs.org/api/path.html#path_path_isabsolute_path) ponyfill

> Ponyfill: A polyfill that doesn't overwrite the native method


## Install

```
$ npm install --save path-is-absolute
```


## Usage

```js
var pathIsAbsolute = require('path-is-absolute');

// Linux
pathIsAbsolute('/home/foo');
//=> true

// Windows
pathIsAbsolute('C:/Users/');
//=> true

// Any OS
pathIsAbsolute.posix('/home/foo');
//=> true
```


## API

See the [`path.isAbsolute()` docs](http://nodejs.org/api/path.html#path_path_isabsolute_path).

### pathIsAbsolute(path)

### pathIsAbsolute.posix(path)

The Posix specific version.

### pathIsAbsolute.win32(path)

The Windows specific version.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
