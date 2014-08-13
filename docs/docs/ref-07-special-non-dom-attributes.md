---
id: special-non-dom-attributes
title: Special Non-DOM Attributes
permalink: special-non-dom-attributes.html
prev: dom-differences.html
next: reconciliation.html
---

Beside [DOM differences](/react/docs/dom-differences.html), React offers some attributes that simply don't exist in DOM.

- `key`: an optional, unique identifier. When your component shuffles around during `render` passes, it might be destroyed and recreated due to the diff algorithm. Assigning it a key that persists makes sure the component stays. See more [here](/react/docs/multiple-components.html#dynamic-children).
- `ref`: see [here](/react/docs/more-about-refs.html).
- `dangerouslySetInnerHTML`: takes an object with the key `__html` and a DOM string as value. This is mainly for cooperating with DOM string manipulation libraries. Refer to the last example on the front page.
