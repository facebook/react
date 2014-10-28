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

We provide CDN-hosted versions of React [on our download page](/react/downloads.html). These prebuilt files use the UMD module format. Dropping them in with a simple `<script>` tag will inject a `React` global into your environment. It should also work out-of-the-box in CommonJS and AMD environments.


### Using master

We have instructions for building from `master` [in our GitHub repository](https://github.com/facebook/react). We build a tree of CommonJS modules under `build/modules` which you can drop into any environment or packaging tool that supports CommonJS.

## JSX

### In-browser JSX Transform

If you like using JSX, we provide an in-browser JSX transformer for development [on our download page](/react/downloads.html). Simply include a `<script type="text/jsx">` tag to engage the JSX transformer.

> Note:
>
> The in-browser JSX transformer is fairly large and results in extraneous computation client-side that can be avoided. Do not use it in production — see the next section.


### Productionizing: Precompiled JSX

If you have [npm](http://npmjs.org/), you can simply run `npm install -g react-tools` to install our command-line `jsx` tool. This tool will translate files that use JSX syntax to plain JavaScript files that can run directly in the browser. It will also watch directories for you and automatically transform files when they are changed; for example: `jsx --watch src/ build/`. Run `jsx --help` for more information on how to use this tool.


### Helpful Open-Source Projects

The open-source community has built tools that integrate JSX with several editors and build systems. See [JSX integrations](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations) for the full list.
