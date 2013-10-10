---
id: jsx-root-node-count
title: Maximum number of JSX root nodes
layout: cookbook
permalink: jsx-root-node-count.html
prev: self-closing-tag.html
next: style-prop-value-px.html
---

### Problem
You're getting a parsing error from JSX.

### Solution
You might have tried to return more than one node in your component's `render`. Currently, you can only return one node, meaning that you must wrap your components within, say, a `div` or a `span` (or any other component).

### Discussion
Don't forget that JSX compiles into regular js; returning two functions doesn't really make syntactic sense. Likewise, don't put more than one child in a ternary.
