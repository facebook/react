# strip-ansi [![Build Status](https://travis-ci.org/sindresorhus/strip-ansi.svg?branch=master)](https://travis-ci.org/sindresorhus/strip-ansi)

> Strip [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code)


## Install

```sh
$ npm install --save strip-ansi
```


## Usage

```js
var stripAnsi = require('strip-ansi');

stripAnsi('\u001b[4mcake\u001b[0m');
//=> 'cake'
```


## CLI

```sh
$ npm install --global strip-ansi
```

```sh
$ strip-ansi --help

  Usage
    strip-ansi <input-file> > <output-file>
    cat <input-file> | strip-ansi > <output-file>

  Example
    strip-ansi unicorn.txt > unicorn-stripped.txt
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
