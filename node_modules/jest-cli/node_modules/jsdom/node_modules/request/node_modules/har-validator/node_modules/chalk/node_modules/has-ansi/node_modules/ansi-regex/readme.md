# ansi-regex [![Build Status](https://travis-ci.org/sindresorhus/ansi-regex.svg?branch=master)](https://travis-ci.org/sindresorhus/ansi-regex)

> Regular expression for matching [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code)


## Install

```sh
$ npm install --save ansi-regex
```


## Usage

```js
var ansiRegex = require('ansi-regex');

ansiRegex().test('\u001b[4mcake\u001b[0m');
//=> true

ansiRegex().test('cake');
//=> false

'\u001b[4mcake\u001b[0m'.match(ansiRegex());
//=> ['\u001b[4m', '\u001b[0m']
```

*It's a function so you can create multiple instances. Regexes with the global flag will have the `.lastIndex` property changed for each call to methods on the instance. Therefore reusing the instance with multiple calls will not work as expected for `.test()`.*


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
