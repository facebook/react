---
id: componentWillReceiveProps-not-triggered-after-mounting
title: componentWillReceiveProps not triggered after mounting
layout: docs
permalink: componentWillReceiveProps-not-triggered-after-mounting.html
---

### Problem
`componentWillReceiveProps` isn't triggered after the node is put on scene.

### Solution
This is by design. Check out [other lifecycle methods](/react/docs/cookbook/component-specs.html) for the one that suits your needs.

### Discussion
`componentWillReceiveProps` often handles the logic of comparing with the old props and acting upon changes; not triggering it at mounting (where there are no old props) helps in defining what the method does.
