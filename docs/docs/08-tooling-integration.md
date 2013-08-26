---
id: tooling-integration
title: Tooling integration
layout: docs
permalink: tooling-integration.html
prev: more-about-refs.html
next: reference.html
---

Every project uses a different system for building and deploying JavaScript. We've tried to make React as environment-agnostic as possible.

## React

### CDN-hosted React

We provide CDN-hosted versions of React [on our download page](/react/downloads.html). These prebuilt files use the UMD module format. Dropping them in with a simple `<script>` tag will inject a `React` global into your environment. It should also work out-of-the-box in CommonJS and AMD environments.


### Using master

We have instructions for building from `master` [in our GitHub repository](https://github.com/facebook/react). We build a tree of CommonJS modules under `build/modules` which you can drop into any environment or packaging tool that supports CommonJS.

## JSX

### In-browser JSX Transform

If you like using JSX, we provide an in-browser JSX transformer for development [on our download page](/react/downloads.html). Simply include a `<script type="text/jsx">` tag to engage the JSX transformer. Be sure to include the `/** @jsx React.DOM */` comment as well, otherwise the transformer will not run the transforms.

> Note:
>
> The in-browser JSX transformer is fairly large and results in extraneous computation client-side that can be avoided. Do not use it in production — see the next section.


### Productionizing: Precompiled JSX

If you have [npm](http://npmjs.org/), you can simply run `npm install -g react-tools` to install our command-line `jsx` tool. This tool will translate files that use JSX syntax to plain JavaScript files that can run directly in the browser. It will also watch directories for you and automatically transform files when they are changed; for example: `jsx --watch src/ build/`. Run `jsx --help` for more information on how to use this tool.


### Helpful Open-Source Projects

The open-source community has built tools that integrate JSX with several build systems.

* [reactify](https://github.com/andreypopp/reactify) - use JSX with [browserify](http://browserify.org/)
* [grunt-react](https://github.com/ericclemmons/grunt-react) - [grunt](http://gruntjs.com/) task for JSX
* [require-jsx](https://github.com/seiffert/require-jsx) - use JSX with [require.js](http://requirejs.org/)
* [pyReact](https://github.com/facebook/react-python) - use JSX with [Python](http://www.python.org/)
* [react-rails](https://github.com/facebook/react-rails) - use JSX with [Ruby on Rails](http://rubyonrails.org/)


## React Page

To get started on a new project, you can use [react-page](https://github.com/facebook/react-page/), a complete React project creator. It supports both server-side and client-side rendering, source transform and packaging JSX files using CommonJS modules, and instant reload.
