# has-ansi [![Build Status](https://travis-ci.org/sindresorhus/has-ansi.svg?branch=master)](https://travis-ci.org/sindresorhus/has-ansi)

> Check if a string has [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code)


## Install

```sh
$ npm install --save has-ansi
```


## Usage

```js
var hasAnsi = require('has-ansi');

hasAnsi('\u001b[4mcake\u001b[0m');
//=> true

hasAnsi('cake');
//=> false
```


## CLI

```sh
$ npm install --global has-ansi
```

```
$ has-ansi --help

  Usage
    has-ansi <string>
    echo <string> | has-ansi

  Exits with code 0 if input has ANSI escape codes and 1 if not
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
