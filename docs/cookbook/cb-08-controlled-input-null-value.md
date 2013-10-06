---
id: controlled-input-null-value
title: Value of null for controlled input
layout: docs
permalink: controlled-input-null-value.html
---

### Problem
You specified a `value` parameter for your form input, but the input value can still be modified, contrary to [what you'd expect](forms.html).

### Solution
You might have accidentally set `value` to `undefined` or `null`. The snippet below shows this phenomenon; after a second, the text becomes editable.

```js
/** @jsx React.DOM */

React.renderComponent(<input value="hi" />, mountNode);

setTimeout(function() {
  React.renderComponent(<input value={null} />, mountNode);
}, 2000);
```
