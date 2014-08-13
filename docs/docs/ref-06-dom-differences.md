---
id: dom-differences
title: DOM Differences
permalink: dom-differences.html
prev: events.html
next: special-non-dom-attributes.html
---

React has implemented a browser-independent events and DOM system for performance and cross-browser compatibility reasons. We took the opportunity to clean up a few rough edges in browser DOM implementations.

* All DOM properties and attributes (including event handlers) should be camelCased to be consistent with standard JavaScript style. We intentionally break with the spec here since the spec is inconsistent. **However**, `data-*` and `aria-*` attributes [conform to the specs](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes#data-*) and should be lower-cased only.
* The `style` attribute accepts a JavaScript object with camelCased properties rather than a CSS string. This is consistent with the DOM `style` JavaScript property, is more efficient, and prevents XSS security holes.
* All event objects conform to the W3C spec, and all events (including submit) bubble correctly per the W3C spec. See [Event System](/react/docs/events.html) for more details.
* The `onChange` event behaves as you would expect it to: whenever a form field is changed this event is fired rather than inconsistently on blur. We intentionally break from existing browser behavior because `onChange` is a misnomer for its behavior and React relies on this event to react to user input in real time. See [Forms](/react/docs/forms.html) for more details.
* Form input attributes such as `value` and `checked`, as well as `textarea`. [More here](/react/docs/forms.html).
