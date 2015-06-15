# mime-db

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

This is a database of all mime types.
It consists of a single, public JSON file and does not include any logic,
allowing it to remain as un-opinionated as possible with an API.
It aggregates data from the following sources:

- http://www.iana.org/assignments/media-types/media-types.xhtml
- http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types

## Installation

```bash
npm install mime-db
```

If you're crazy enough to use this in the browser,
you can just grab the JSON file:

```
https://cdn.rawgit.com/jshttp/mime-db/master/db.json
```

## Usage

```js
var db = require('mime-db');

// grab data on .js files
var data = db['application/javascript'];
```

## Data Structure

The JSON file is a map lookup for lowercased mime types.
Each mime type has the following properties:

- `.source` - where the mime type is defined.
    If not set, it's probably a custom media type.
    - `apache` - [Apache common media types](http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types)
    - `iana` - [IANA-defined media types](http://www.iana.org/assignments/media-types/media-types.xhtml)
- `.extensions[]` - known extensions associated with this mime type.
- `.compressible` - whether a file of this type is can be gzipped.
- `.charset` - the default charset associated with this type, if any.

If unknown, every property could be `undefined`.

## Contributing

To edit the database, only make PRs against `src/custom.json` or
`src/custom-suffix.json`.

To update the build, run `npm run update`.

## Adding Custom Media Types

The best way to get new media types included in this library is to register
them with the IANA. The community registration procedure is outlined in
[RFC 6838 section 5](http://tools.ietf.org/html/rfc6838#section-5). Types
registered with the IANA are automatically pulled into this library.

[npm-version-image]: https://img.shields.io/npm/v/mime-db.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/mime-db.svg
[npm-url]: https://npmjs.org/package/mime-db
[travis-image]: https://img.shields.io/travis/jshttp/mime-db/master.svg
[travis-url]: https://travis-ci.org/jshttp/mime-db
[coveralls-image]: https://img.shields.io/coveralls/jshttp/mime-db/master.svg
[coveralls-url]: https://coveralls.io/r/jshttp/mime-db?branch=master
[node-image]: https://img.shields.io/node/v/mime-db.svg
[node-url]: http://nodejs.org/download/
