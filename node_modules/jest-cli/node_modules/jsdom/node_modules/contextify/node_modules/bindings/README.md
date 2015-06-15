node-bindings
=============
### Helper module for loading your native module's .node file

This is a helper module for authors of Node.js native addon modules.
It is basically the "swiss army knife" of `require()`ing your native module's
`.node` file.

Throughout the course of Node's native addon history, addons have ended up being
compiled in a variety of different places, depending on which build tool and which
version of node was used. To make matters worse, now the _gyp_ build tool can
produce either a _Release_ or _Debug_ build, each being built into different
locations.

This module checks _all_ the possible locations that a native addon would be built
at, and returns the first one that loads successfully.


Installation
------------

Install with `npm`:

``` bash
$ npm install bindings
```

Or add it to the `"dependencies"` section of your _package.json_ file.


Example
-------

`require()`ing the proper bindings file for the current node version, platform
and architecture is as simple as:

``` js
var bindings = require('bindings')('binding.node')

// Use your bindings defined in your C files
bindings.your_c_function()
```


Nice Error Output
-----------------

When the `.node` file could not be loaded, `node-bindings` throws an Error with
a nice error message telling you exactly what was tried. You can also check the
`err.tries` Array property.

```
Error: Could not load the bindings file. Tried:
 → /Users/nrajlich/ref/build/binding.node
 → /Users/nrajlich/ref/build/Debug/binding.node
 → /Users/nrajlich/ref/build/Release/binding.node
 → /Users/nrajlich/ref/out/Debug/binding.node
 → /Users/nrajlich/ref/Debug/binding.node
 → /Users/nrajlich/ref/out/Release/binding.node
 → /Users/nrajlich/ref/Release/binding.node
 → /Users/nrajlich/ref/build/default/binding.node
 → /Users/nrajlich/ref/compiled/0.8.2/darwin/x64/binding.node
    at bindings (/Users/nrajlich/ref/node_modules/bindings/bindings.js:84:13)
    at Object.<anonymous> (/Users/nrajlich/ref/lib/ref.js:5:47)
    at Module._compile (module.js:449:26)
    at Object.Module._extensions..js (module.js:467:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    ...
```


License
-------

(The MIT License)

Copyright (c) 2012 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
