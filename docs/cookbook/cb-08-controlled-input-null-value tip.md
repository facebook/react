---
id: controlled-input-null-value-tip
title: Value of null for controlled input
layout: docs
permalink: controlled-input-null-value-tip.html
---

Specifying the `value` prop on a [controlled component](forms.html) prevents the user from changing the input unless you desire so.

You might have run into a problem where `value` is specified, but the input can still be changed without consent. In this case, you might have accidentally set `value` to `undefined` or `null`.

The snippet below shows this phenomenon; after a second, the text becomes editable.

```js
/** @jsx React.DOM */

React.renderComponent(<input value="hi" />, mountNode);

setTimeout(function() {
  React.renderComponent(<input value={null} />, mountNode);
}, 2000);
```
