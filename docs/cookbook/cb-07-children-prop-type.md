---
id: children-prop-type
title: Type of the children prop
layout: docs
permalink: children-prop-type.html
---

### Problem
You get errors while manipulating `this.props.children` inside a component.

### Solution
Usually, `children` is an array of components. To save an extra array allocation, when it only contains one single component, it returns the component itself.

This means accessing, for example, `this.props.children.length` might be misleading since it could be the length property of a single string component.
