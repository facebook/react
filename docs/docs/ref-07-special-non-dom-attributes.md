---
id: special-non-dom-attributes
title: Special Non-DOM Attributes
permalink: docs/special-non-dom-attributes.html
prev: dom-differences.html
next: reconciliation.html
---

Beside [DOM differences](/react/docs/dom-differences.html), React offers some attributes that simply don't exist in DOM.

- `key`: an optional, unique identifier. When your component shuffles around during `render` passes, it might be destroyed and recreated due to the diff algorithm. Assigning it a key that persists makes sure the component stays. See more [here](/react/docs/multiple-components.html#dynamic-children).
- `ref`: see [here](/react/docs/more-about-refs.html).
- `dangerouslySetInnerHTML`: Provides the ability to insert raw HTML, mainly for cooperating with DOM string manipulation libraries. See more [here](/react/tips/dangerously-set-inner-html.html).
