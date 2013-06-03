---
id: downloads
title: Downloads
layout: single
---
Download the starter kit to get everything you need to
[get started with React](/react/docs/getting-started.html).

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

## Individual Downloads

#### <a href="http://fb.me/react-{{site.react_version}}.min.js">React Core {{site.react_version}} (production)</a>
The compressed, production version of React core

```html
<script src="http://fb.me/react-{{site.react_version}}.min.js"></script>
```

#### <a href="http://fb.me/react-{{site.react_version}}.js">React Core {{site.react_version}} (development)</a>
The uncompressed, development version of React core with inline documentation.

```html
<script src="http://fb.me/react-{{site.react_version}}.js"></script>
```

#### <a href="http://fb.me/JSXTransformer-{{site.react_version}}.js">JSX Transform</a>
The JSX transformer used to support [XML syntax](/react/docs/syntax.html) in JavaScript.

```html
<script src="http://fb.me/JSXTransformer-{{site.react_version}}.js"></script>
```

## Bower

```sh
$ bower install --save react
```

## NPM

```sh
$ npm install -g react-tools
```

## Release Notes

**0.3.2** Improve compatibility of JSX Transformer; make `react-tools` compatible with [browserify](https://github.com/substack/node-browserify)

**0.3.1** Fix `react-tools` module

**0.3** Initial public release.

**0.2** Standardize API & refactor component lifecycle. Normalize DOM interactions.

**0.1** Initial release.
