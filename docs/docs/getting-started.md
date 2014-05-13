---
id: getting-started
title: Getting Started
layout: docs
next: tutorial.html
---

## JSFiddle

The fastest way to try React is by using the following JSFiddle "Hello, World" examples.

 * **[React JSFiddle](http://jsfiddle.net/vjeux/kb3gN/)**
 * [React JSFiddle without JSX](http://jsfiddle.net/vjeux/VkebS/)

## Integrate with an existing app

If you have an existing app, it's easy to try React out on a small feature. Just add the development versions of React and JSX to your page and write your code in a `<script type="text/jsx">` script block:

```html
<script src="http://fb.me/react-with-addons-{{site.react_version}}.js"></script>
<script src="http://fb.me/JSXTransformer-{{site.react_version}}.js"></script>
<script type="text/jsx">
/** @jsx React.DOM */
// Your code here! Don't forget the @jsx comment!
</script>
```

Start building a new feature, but put a call to `React.renderComponent()` where you'd normally render a template, directive, or view.

## Creating full apps from scratch

We have a [list of full-stack starter kits on our complementary tools page](/react/docs/complementary-tools.html#full-stack-starter-kits).

## Using a package manager?

React is available on [npm](https://www.npmjs.org/package/react), [bower](https://github.com/facebook/react-bower) and [component.io](https://github.com/njpatel/react-with-addons).

## Next steps

Check out [the tutorial](/react/docs/tutorial.html) and the other examples in the [`examples/` directory on GitHub](https://github.com/facebook/react/tree/master/examples) to learn more. Good luck, and welcome!
