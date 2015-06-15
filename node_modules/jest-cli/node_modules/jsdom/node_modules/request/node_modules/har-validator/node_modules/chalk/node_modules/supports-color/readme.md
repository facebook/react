# supports-color [![Build Status](https://travis-ci.org/sindresorhus/supports-color.svg?branch=master)](https://travis-ci.org/sindresorhus/supports-color)

> Detect whether a terminal supports color


## Install

```
$ npm install --save supports-color
```


## Usage

```js
var supportsColor = require('supports-color');

if (supportsColor) {
	console.log('Terminal supports color');
}
```

It obeys the `--color` and `--no-color` CLI flags.

For situations where using `--color` is not possible, add an environment variable `FORCE_COLOR` with any value to force color. Trumps `--no-color`.


## CLI

```
$ npm install --global supports-color
```

```
$ supports-color --help

  Usage
    supports-color

  Exits with code 0 if color is supported and 1 if not
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
