---
id: componentWillReceiveProps-not-triggered-after-mounting
title: componentWillReceiveProps Not Triggered After Mounting
layout: tips
permalink: componentWillReceiveProps-not-triggered-after-mounting.html
prev: controlled-input-null-value.html
next: props-in-getInitialState-as-anti-pattern.html
---

`componentWillReceiveProps` isn't triggered after the node is put on scene. This is by design. Check out [other lifecycle methods](/react/docs/component-specs.html) for the one that suits your needs.

The reason for that is because `componentWillReceiveProps` often handles the logic of comparing with the old props and acting upon changes; not triggering it at mounting (where there are no old props) helps in defining what the method does.
