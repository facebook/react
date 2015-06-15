# jsdiff

[![Build Status](https://secure.travis-ci.org/kpdecker/jsdiff.png)](http://travis-ci.org/kpdecker/jsdiff)

A javascript text differencing implementation.

Based on the algorithm proposed in
["An O(ND) Difference Algorithm and its Variations" (Myers, 1986)](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927).

## Installation

    npm install diff

or

    git clone git://github.com/kpdecker/jsdiff.git

## API

* `JsDiff.diffChars(oldStr, newStr)` - diffs two blocks of text, comparing character by character.

    Returns a list of change objects (See below).

* `JsDiff.diffWords(oldStr, newStr)` - diffs two blocks of text, comparing word by word.

    Returns a list of change objects (See below).

* `JsDiff.diffLines(oldStr, newStr)` - diffs two blocks of text, comparing line by line.

    Returns a list of change objects (See below).

* `JsDiff.diffCss(oldStr, newStr)` - diffs two blocks of text, comparing CSS tokens.

    Returns a list of change objects (See below).

* `JsDiff.createPatch(fileName, oldStr, newStr, oldHeader, newHeader)` - creates a unified diff patch.

    Parameters:
    * `fileName` : String to be output in the filename sections of the patch
    * `oldStr` : Original string value
    * `newStr` : New string value
    * `oldHeader` : Additional information to include in the old file header
    * `newHeader` : Additional information to include in thew new file header

* `JsDiff.applyPatch(oldStr, diffStr)` - applies a unified diff patch.

    Return a string containing new version of provided data.

* `convertChangesToXML(changes)` - converts a list of changes to a serialized XML format

### Change Objects
Many of the methods above return change objects. These objects are consist of the following fields:

* `value`: Text content
* `added`: True if the value was inserted into the new string
* `removed`: True of the value was removed from the old string

Note that some cases may omit a particular flag field. Comparison on the flag fields should always be done in a truthy or falsy manner.

## Examples

Basic example in Node

```js
require('colors')
var jsdiff = require('diff');

var one = 'beep boop';
var other = 'beep boob blah';

var diff = jsdiff.diffChars(one, other);

diff.forEach(function(part){
  // green for additions, red for deletions
  // grey for common parts
  var color = part.added ? 'green' :
    part.removed ? 'red' : 'grey';
  process.stderr.write(part.value[color]);
});

console.log()
```
Running the above program should yield

<img src="images/node_example.png" alt="Node Example">

Basic example in a web page

```html
<pre id="display"></pre>
<script src="diff.js"></script>
<script>
var one = 'beep boop';
var other = 'beep boob blah';

var diff = JsDiff.diffChars(one, other);

diff.forEach(function(part){
  // green for additions, red for deletions
  // grey for common parts
  var color = part.added ? 'green' :
    part.removed ? 'red' : 'grey';
  var span = document.createElement('span');
  span.style.color = color;
  span.appendChild(document
    .createTextNode(part.value));
  display.appendChild(span);
});
</script>
```

Open the above .html file in a browser and you should see

<img src="images/web_example.png" alt="Node Example">

**[Full online demo](http://kpdecker.github.com/jsdiff)**

## License

Software License Agreement (BSD License)

Copyright (c) 2009-2011, Kevin Decker kpdecker@gmail.com

All rights reserved.

Redistribution and use of this software in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above
  copyright notice, this list of conditions and the
  following disclaimer.

* Redistributions in binary form must reproduce the above
  copyright notice, this list of conditions and the
  following disclaimer in the documentation and/or other
  materials provided with the distribution.

* Neither the name of Kevin Decker nor the names of its
  contributors may be used to endorse or promote products
  derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/kpdecker/jsdiff/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

