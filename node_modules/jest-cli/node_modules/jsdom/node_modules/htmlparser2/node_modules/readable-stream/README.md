# readable-stream

***Node-core streams for userland***

[![NPM](https://nodei.co/npm/readable-stream.png?downloads=true&downloadRank=true)](https://nodei.co/npm/readable-stream/)
[![NPM](https://nodei.co/npm-dl/readable-stream.png&months=6&height=3)](https://nodei.co/npm/readable-stream/)

This package is a mirror of the Streams2 and Streams3 implementations in Node-core.

If you want to guarantee a stable streams base, regardless of what version of Node you, or the users of your libraries are using, use **readable-stream** *only* and avoid the *"stream"* module in Node-core.

**readable-stream** comes in two major versions, v1.0.x and v1.1.x. The former tracks the Streams2 implementation in Node 0.10, including bug-fixes and minor improvements as they are added. The latter tracks Streams3 as it develops in Node 0.11; we will likely see a v1.2.x branch for Node 0.12.

**readable-stream** uses proper patch-level versioning so if you pin to `"~1.0.0"` you’ll get the latest Node 0.10 Streams2 implementation, including any fixes and minor non-breaking improvements. The patch-level versions of 1.0.x and 1.1.x should mirror the patch-level versions of Node-core releases. You should prefer the **1.0.x** releases for now and when you’re ready to start using Streams3, pin to `"~1.1.0"`

