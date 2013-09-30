---
id: children-prop-type-tip
title: Type of the children prop
layout: docs
permalink: children-prop-type-tip.html
---

Usually, when manipulating a component's children through `this.props.children`, an array is expected. To save an extra array allocation, when `children` only contains one single component, it returns the component itself, without the array wrapper.

This means accessing, for example, `this.props.children.length` might be misleading since it could be the length property of a single string component.
