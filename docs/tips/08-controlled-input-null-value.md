---
id: controlled-input-null-value
title: Value of null for Controlled Input
layout: tips
permalink: controlled-input-null-value.html
prev: children-props-type.html
next: componentWillReceiveProps-not-triggered-after-mounting.html
---

Specifying the `value` prop on a [controlled component](/react/docs/forms.html) prevents the user from changing the input unless you desire so.

You might have run into a problem where `value` is specified, but the input can still be changed without consent. In this case, you might have accidentally set `value` to `undefined` or `null`.

The snippet below shows this phenomenon; after a second, the text becomes editable.

```js
React.render(<input value="hi" />, mountNode);

setTimeout(function() {
  React.render(<input value={null} />, mountNode);
}, 1000);
```
