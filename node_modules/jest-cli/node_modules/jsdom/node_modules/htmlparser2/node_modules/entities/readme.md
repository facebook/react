#entities [![NPM version](http://img.shields.io/npm/v/entities.svg)](https://npmjs.org/package/entities)  [![Downloads](https://img.shields.io/npm/dm/entities.svg)](https://npmjs.org/package/entities) [![Build Status](http://img.shields.io/travis/fb55/node-entities.svg)](http://travis-ci.org/fb55/node-entities) [![Coverage](http://img.shields.io/coveralls/fb55/node-entities.svg)](https://coveralls.io/r/fb55/node-entities)

En- & decoder for XML/HTML entities.

####Features:
* Focussed on ___speed___
* Supports three levels of entities: __XML__, __HTML4__ & __HTML5__
    * Supports _char code_ entities (eg. `&#x55;`)

##How to…

###…install `entities`

    npm i entities

###…use `entities`

```javascript
//encoding
require("entities").encode(<str> data[, <int> level]);
//decoding
require("entities").decode(<str> data[, <int> level]);
```

The `level` attribute indicates what level of entities should be decoded (0 = XML, 1 = HTML4 and 2 = HTML5). The default is 0 (read: XML).

There are also methods to access the level directly. Just append the name of the level to the action and you're ready to go (e.g. `encodeHTML4(data)`, `decodeXML(data)`).

---

License: BSD-like
