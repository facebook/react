---
id: jsx-root-node-count-tip
title: Maximum number of JSX root nodes
layout: docs
permalink: jsx-root-node-count-tip.html
---

Currently, in a component's `render`, you can only return one node; if you have, say, a list of `div`s to return, you must wrap your components within a `div`, `span` or any other component.

Don't forget that JSX compiles into regular js; returning two functions doesn't really make syntactic sense. Likewise, don't put more than one child in a ternary.
