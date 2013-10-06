---
id: self-closing-tag
title: Self-Closing Tag
layout: docs
permalink: self-closing-tag.html
---

### Problem
You're getting a parsing error (unexpected token) from JSX.

### Solution
One of the reasons might be that you didn't put a `/` for your self-closing tags. `<MyComponent />` is valid while `<MyComponent>` isn't.

### Discussion
In fact, every React component can be self-closing: `<div/>`.
