# graceful-readlink
[![NPM Version](http://img.shields.io/npm/v/graceful-readlink.svg?style=flat)](https://www.npmjs.org/package/graceful-readlink)
[![NPM Downloads](https://img.shields.io/npm/dm/graceful-readlink.svg?style=flat)](https://www.npmjs.org/package/graceful-readlink)


## Usage

```js
var readlinkSync = require('graceful-readlink').readlinkSync;
console.log(readlinkSync(f));
// output
//  the file pointed to when `f` is a symbolic link
//  the `f` itself when `f` is not a symbolic link
```
## Licence

MIT License
