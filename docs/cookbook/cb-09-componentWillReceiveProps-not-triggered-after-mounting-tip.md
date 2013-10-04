---
id: componentWillReceiveProps-not-triggered-after-mounting-tip
title: componentWillReceiveProps not triggered after mounting
layout: docs
permalink: componentWillReceiveProps-not-triggered-after-mounting-tip.html
---

`componentWillReceiveProps` isn't triggered after the node is put on scene. This is by design. Check out [other lifecycle methods](component-specs.html) for the one that suits your needs.

The reason for that is because `componentWillReceiveProps` often handles the logic of comparing with the old props and act upon changes; not triggering it at mounting, where there are no old props, clearly defines what the method should do.
