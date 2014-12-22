---
id: maximum-number-of-jsx-root-nodes
title: Maximum Number of JSX Root Nodes
layout: tips
permalink: maximum-number-of-jsx-root-nodes.html
prev: self-closing-tag.html
next: style-props-value-px.html
---

Currently, in a component's `render`, you can only return one node; if you have, say, a list of `div`s to return, you must wrap your components within a `div`, `span` or any other component.

Don't forget that JSX compiles into regular JS; returning two functions doesn't really make syntactic sense. Likewise, don't put more than one child in a ternary.
