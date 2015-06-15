# JSON Pointer for nodejs

This is an implementation of [JSON Pointer](http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-08).

## Usage

    var jsonpointer = require("jsonpointer");
    var obj = { foo: 1, bar: { baz: 2}, qux: [3, 4, 5]};
    var one = jsonpointer.get(obj, "/foo");
    var two = jsonpointer.get(obj, "/bar/baz");
    var three = jsonpointer.get(obj, "/qux/0");
    var four = jsonpointer.get(obj, "/qux/1");
    var five = jsonpointer.get(obj, "/qux/2");

    jsonpointer.set(obj, "/foo", 6); // obj.foo = 6;

## Testing

    $ node test.js
    All tests pass.
    $

[![Build Status](https://travis-ci.org/janl/node-jsonpointer.png?branch=master)](undefined)

## Author

(c) 2011 Jan Lehnardt <jan@apache.org>

## License

MIT License.