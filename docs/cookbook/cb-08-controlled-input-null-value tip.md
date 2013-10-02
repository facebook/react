---
id: controlled-input-null-value-tip
title: Value of null for controlled input
layout: docs
permalink: controlled-input-null-value-tip.html
---

With a controlled input component, specifying a `value` prevents the user from changing the input unless you desire so (more info [here](forms.html)).

You might have ran into a problem where you specified a `value` but the input can still be changed. In this case, you might have accidentally set your `value` to `undefined` or `null`. The snippet below shows this phenomenon; after a second, the text can be edited.

```js
/** @jsx React.DOM */

React.renderComponent(<input value="hi" />, mountNode);

setTimeout(function() {
  React.renderComponent(<input value={null} />, mountNode);
}, 2000);
```
