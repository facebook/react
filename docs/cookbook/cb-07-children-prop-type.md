---
id: children-prop-type
title: Type of the children prop
layout: cookbook
permalink: children-prop-type.html
prev: style-prop-value-px.html
next: controlled-input-null-value.html
---

### Problem
You get errors while manipulating `this.props.children` inside a component.

### Solution
Usually, `children` is an array of components. To save an extra array allocation, it returns the component itself when there's only one.

This means accessing, for example, `this.props.children.length` might be misleading, as it could either be the `length` property of the array of children, or that of a single string component.
