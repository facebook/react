# HAR Validator [![version][npm-version]][npm-url] [![License][npm-license]][license-url]

Extremely fast HTTP Archive ([HAR](http://www.softwareishard.com/blog/har-12-spec/)) validator using JSON Schema.

[![Build Status][travis-image]][travis-url]
[![Downloads][npm-downloads]][npm-url]
[![Code Climate][codeclimate-quality]][codeclimate-url]
[![Coverage Status][codeclimate-coverage]][codeclimate-url]
[![Dependencies][david-image]][david-url]

## Install

```shell
# to use in cli
npm install --global har-validator

# to use as a module
npm install --save har-validator
```

## Usage

```

  Usage: har-validator [options] <files ...>

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -s, --schema [name]  validate schema name (log, request, response, etc ...)

```

###### Example

```shell
har-validator har.json

har-validator --schema request request.json
```

## API

### Validate(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a full [HAR](http://www.softwareishard.com/blog/har-12-spec/) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var HAR = require('./har.json');
var validate = require('har-validator');

validate(HAR, function (e, valid) {
  if (e) console.log(e.errors)

  if (valid) console.log('horray!');
});
```

### Validate.log(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [log](http://www.softwareishard.com/blog/har-12-spec/#log) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.log(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.cache(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [cache](http://www.softwareishard.com/blog/har-12-spec/#cache) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.cache(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.cacheEntry(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a ["beforeRequest" or "afterRequest"](http://www.softwareishard.com/blog/har-12-spec/#cache) objects

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.cacheEntry(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.content(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [content](http://www.softwareishard.com/blog/har-12-spec/#content) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.content(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.cookie(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [cookie](http://www.softwareishard.com/blog/har-12-spec/#cookies) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.cookie(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.creator(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [creator](http://www.softwareishard.com/blog/har-12-spec/#creator) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.creator(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.entry(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  an [entry](http://www.softwareishard.com/blog/har-12-spec/#entries) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.entry(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.log(data [, callback])

alias of [`Validate(data [, callback])`](#validate-data-callback-)

### Validate.page(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [page](http://www.softwareishard.com/blog/har-12-spec/#pages) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.page(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.pageTimings(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [pageTimings](http://www.softwareishard.com/blog/har-12-spec/#pageTimings) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.pageTimings(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.postData(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [postData](http://www.softwareishard.com/blog/har-12-spec/#postData) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.postData(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.record(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [record](http://www.softwareishard.com/blog/har-12-spec/#headers) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.record(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.request(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [request](http://www.softwareishard.com/blog/har-12-spec/#request) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.request(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.response(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [response](http://www.softwareishard.com/blog/har-12-spec/#response) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.cacheEntry(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

### Validate.timings(data [, callback])

Returns `true` or `false`.

- **data**: `Object` *(Required)*
  a [timings](http://www.softwareishard.com/blog/har-12-spec/#timings) object

- **callback**: `Function`
  gets two arguments (err, valid)

```js
var validate = require('har-validator');

validate.timings(data, function (e, valid) {
  if (e) console.log(e.errors)
});
```

## Support

Donations are welcome to help support the continuous development of this project.

[![Gratipay][gratipay-image]][gratipay-url]
[![PayPal][paypal-image]][paypal-url]
[![Flattr][flattr-image]][flattr-url]
[![Bitcoin][bitcoin-image]][bitcoin-url]

## License

[MIT](LICENSE) &copy; [Ahmad Nassri](https://www.ahmadnassri.com)

[license-url]: https://github.com/ahmadnassri/har-validator/blob/master/LICENSE

[travis-url]: https://travis-ci.org/ahmadnassri/har-validator
[travis-image]: https://img.shields.io/travis/ahmadnassri/har-validator.svg?style=flat-square

[npm-url]: https://www.npmjs.com/package/har-validator
[npm-license]: https://img.shields.io/npm/l/har-validator.svg?style=flat-square
[npm-version]: https://img.shields.io/npm/v/har-validator.svg?style=flat-square
[npm-downloads]: https://img.shields.io/npm/dm/har-validator.svg?style=flat-square

[codeclimate-url]: https://codeclimate.com/github/ahmadnassri/har-validator
[codeclimate-quality]: https://img.shields.io/codeclimate/github/ahmadnassri/har-validator.svg?style=flat-square
[codeclimate-coverage]: https://img.shields.io/codeclimate/coverage/github/ahmadnassri/har-validator.svg?style=flat-square

[david-url]: https://david-dm.org/ahmadnassri/har-validator
[david-image]: https://img.shields.io/david/ahmadnassri/har-validator.svg?style=flat-square

[gratipay-url]: https://www.gratipay.com/ahmadnassri/
[gratipay-image]: https://img.shields.io/gratipay/ahmadnassri.svg?style=flat-square

[paypal-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UJ2B2BTK9VLRS&on0=project&os0=har-validator
[paypal-image]: http://img.shields.io/badge/paypal-donate-green.svg?style=flat-square

[flattr-url]: https://flattr.com/submit/auto?user_id=ahmadnassri&url=https://github.com/ahmadnassri/har-validator&title=har-validator&language=&tags=github&category=software
[flattr-image]: http://img.shields.io/badge/flattr-donate-green.svg?style=flat-square

[bitcoin-image]: http://img.shields.io/badge/bitcoin-1Nb46sZRVG3or7pNaDjthcGJpWhvoPpCxy-green.svg?style=flat-square
[bitcoin-url]: https://www.coinbase.com/checkouts/ae383ae6bb931a2fa5ad11cec115191e?name=har-validator
