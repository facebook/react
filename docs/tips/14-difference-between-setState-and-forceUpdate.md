---
id: difference-between-setState-and-forceUpdate
title: Difference Between setState and forceUpdate
layout: tips
permalink: difference-between-setState-and-forceUpdate.html
prev: false-in-jsx.html
---

A component's [`setState()`](/react/docs/component-api.html#setstate) without argument and [`forceUpdate()`](/react/docs/component-api.html#forceupdate) do mostly the same thing, except the latter skips [`shouldComponentUpdate()`](/react/docs/component-specs.html#updating-shouldcomponentupdate).
