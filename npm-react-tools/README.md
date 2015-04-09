# react-tools

This package compliments the usage of [React](http://facebook.github.io/react/). It ships with tools that are often used in conjunction.

## JSX

This package installs a `jsx` executable that can be used to transform JSX into vanilla JS. This is often used as part of a build step. This transform is also exposed as an API.

By default JSX files with a `.js` extension are transformed. Use the `-x` option to transform files with a `.jsx` extension.

## Usage

### Command Line

    Usage: jsx [options] <source directory> <output directory> [<module ID> [<module ID> ...]]

    Options:

      -h, --help                               output usage information
      -V, --version                            output the version number
      -c, --config [file]                      JSON configuration file (no file or - means STDIN)
      -w, --watch                              Continually rebuild
      -x, --extension <js | coffee | ...>      File extension to assume when resolving module identifiers (default: js)
      --relativize                             Rewrite all module identifiers to be relative
      --follow-requires                        Scan modules for required dependencies
      --cache-dir <directory>                  Alternate directory to use for disk cache
      --no-cache-dir                           Disable the disk cache
      --source-charset <utf8 | win1252 | ...>  Charset of source (default: utf8)
      --output-charset <utf8 | win1252 | ...>  Charset of output (default: utf8)
      --harmony                                Turns on JS transformations such as ES6 Classes etc.
      --source-map-inline                      Embed inline sourcemap in transformed source
      --strip-types                            Strips out type annotations
      --es6module                              Parses the file as a valid ES6 module
      --non-strict-es6module                   Parses the file as an ES6 module, except disables implicit strict-mode (i.e. CommonJS modules et al are allowed)
      --target <version>                       Target version of ECMAScript. Valid values are "es3" and "es5". Use "es3" for legacy browsers like IE8.

## API

### `transform(inputString, options)`

option | values | default
-------|--------|---------
`sourceMap` | `true`: append inline source map at the end of the transformed source | `false`
`harmony` | `true`: enable ES6 features | `false`
`sourceFilename` | the output filename for the source map | `"source.js"`
`stripTypes` | `true`: strips out type annotations | `false`
`es6module` | `true`: parses the file as an ES6 module | `false`
`nonStrictEs6module` | `true`: parses the file as an ES6 module, except disables implicit strict-mode (i.e. CommonJS modules et al are allowed) | `false`
`target` | `"es3"`: ECMAScript 3<br>`"es5"`: ECMAScript 5| `"es5"`

```js
var reactTools = require('react-tools');

reactTools.transform(string, options);
```

### `transformWithDetails(inputString, options)`

Just like `transform`, but outputs an object:
```js
{
  code: outputString,
  sourceMap: theSourceMap // Only if the `sourceMap` option is `true`.
}
```
