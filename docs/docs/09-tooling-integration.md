---
id: tooling-integration
title: Tooling Integration
permalink: tooling-integration.html
prev: more-about-refs.html
next: addons.html
---

Every project uses a different system for building and deploying JavaScript. We've tried to make React as environment-agnostic as possible.

## React

### CDN-hosted React

We provide CDN-hosted versions of React [on our download page](/react/downloads.html). These pre-built files use the UMD module format. Dropping them in with a simple `<script>` tag will inject a `React` global into your environment. It should also work out-of-the-box in CommonJS and AMD environments.

### Using master

We have instructions for building from `master` [in our GitHub repository](https://github.com/facebook/react). We build a tree of CommonJS modules under `build/modules` which you can drop into any environment or packaging tool that supports CommonJS.

## JSX

### In-browser JSX Transform

If you like using JSX, Babel 5 provided an in-browser ES6 and JSX transformer for development called browser.js that can be included from [CDNJS](http://cdnjs.com/libraries/babel-core/5.8.34). Include a `<script type="text/babel">` tag to engage the JSX transformer.

> Note:
>
> The in-browser JSX transformer is fairly large and results in extraneous computation client-side that can be avoided. Do not use it in production — see the next section.

### Productionizing: Precompiled JSX

If you have [npm](https://www.npmjs.com/), you can run `npm install -g babel-cli`. Babel has built-in support for React v0.12+. Tags are automatically transformed to their equivalent `React.createElement(...)`, `displayName` is automatically inferred and added to all `React.createClass` calls.

This tool will translate files that use JSX syntax to plain JavaScript files that can run directly in the browser. It will also watch directories for you and automatically transform files when they are changed; for example: `babel --watch src/ --out-dir lib/`.

Beginning with Babel 6, there are no transforms included by default. This means that options must be specified when running the `babel` command, or a `.babelrc` must specify options. Additional packages must also be installed which bundle together a number of transforms, called presets. The most common use when working with React will be to include the `es2015` and `react` presets. More information about the changes to Babel can be found in [their blog post announcing Babel 6](http://babeljs.io/blog/2015/10/29/6.0.0/).

Here is an example of what you will do if using ES2015 syntax and React:

```
npm install babel-preset-es2015 babel-preset-react
babel --presets es2015,react --watch src/ --out-dir lib/
```

By default JSX files with a `.js` extension are transformed. Run `babel --help` for more information on how to use Babel.

Example output:

```
$ cat test.jsx
var HelloMessage = React.createClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

ReactDOM.render(<HelloMessage name="John" />, mountNode);
$ babel test.jsx
"use strict";

var HelloMessage = React.createClass({
  displayName: "HelloMessage",

  render: function render() {
    return React.createElement(
      "div",
      null,
      "Hello ",
      this.props.name
    );
  }
});

ReactDOM.render(React.createElement(HelloMessage, { name: "John" }), mountNode);
```

### Helpful Open-Source Projects

The open-source community has built tools that integrate JSX with several editors and build systems. See [JSX integrations](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations) for the full list.
