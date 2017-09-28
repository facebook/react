---
title: "Introducing the JSX Specification"
author: [sebmarkbage]
---

At Facebook we've been using JSX for a long time. We originally introduced it to the world last year alongside React, but we actually used it in another form before that to create native DOM nodes. We've also seen some similar efforts grow out of our work in order to be used with other libraries and in interesting ways. At this point React JSX is just one of many implementations.

In order to make it easier to implement new versions and to make sure that the syntax remains compatible, we're now formalizing the syntax of JSX in a stand-alone spec without any semantic meaning. It's completely stand-alone from React itself.

Read the spec now at <https://facebook.github.io/jsx/>.

This is not a proposal to be standardized in ECMAScript. It's just a reference document that transpiler writers and syntax highlighters can agree on. It's currently in a draft stage and will probably continue to be a living document.

Feel free to [open an Issue](https://github.com/facebook/jsx/issues/new) or Pull Request if you find something wrong.
