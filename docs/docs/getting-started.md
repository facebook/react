---
id: docs-getting-started
title: Getting Started
description: Try React With A Single Click.
layout: docs
next: tutorial.html
---

<div class="buttons-unit">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

## Starter Kit

To try out React, download the Starter Kit. The Starter Kit contains a recent
build of React along with a few simple examples. It also includes a utility for
transforming [JSX](syntax.html) directly in the browser. 

###JSX in the Browser###

In the root directory of the starter kit, create a `helloworld.html` with the
following contents.


```html
<!DOCTYPE html>
<html>
  <head>
    <script src="build/react.min.js"></script>
    <script src="build/JSXTransformer.js"></script>
  </head>
  <script type="text/jsx">
    /** @jsx React.DOM */
    React.renderComponent(<h1>Hello, world!</h1>, document.body);
  </script>
  <body>
  </body>
</html>
```

The XML syntax inside of JavaScript is called [JSX](syntax.html). In order to translate it to vanilla JavaScript we use `<script type="text/jsx">` and include `JSXTransformer.js` to actually perform the transformation in the browser.

### JSX in Separate Files###

Your React JSX file can live in a separate file. Create the following `src/helloworld.js`.

```javascript
/** @jsx React.DOM */
React.renderComponent(<h1>Hello, world!</h1>, document.body);
```
Then reference it from `helloworld.html`:

```html{10}
<script type="text/jsx" src="src/helloworld.js"></script>
```

### Command Line Transform

The in-browser JSX transform is a great way to try out React, but it is not
suitable for serious development. To use the command line transformer, first
install the command-line React tools (requires [npm](http://npmjs.org/)):

```
npm install -g react-tools
```

Then, translate your `src/helloworld.js` file to plain JavaScript:

```
jsx --watch src/ build/

```

Whenever `src/helloworld.js` is changed, `build/helloworld.js` is generated as
follows:

```javascript{3}
/** @jsx React.DOM */
React.renderComponent(React.DOM.h1(null, 'Hello, world!'), document.body);
```

Update your HTML file as below:

```html{6,10}
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React!</title>
    <script src="build/react.min.js"></script>
    <!-- No need for JSXTransformer! -->
  </head>
  <body>
    <script src="build/helloworld.js"></script>
  </body>
</html>
```

## Using CommonJS

If you want to use React within a module system, [fork our repo](http://github.com/facebook/react), `npm install` and run `grunt`. A nice set of CommonJS modules will be generated. Our `jsx` build tool can be integrated into most packaging systems (not just CommonJS) quite easily.

## JSFiddle

The easiest way to start hacking on React is by using the following JSFiddle Hello World examples.

 * **[React JSFiddle](http://jsfiddle.net/vjeux/kb3gN/)**
 * [React JSFiddle without JSX](http://jsfiddle.net/vjeux/VkebS/)


## Next Steps

Check out [the tutorial](tutorial.html) and the other examples in the `/examples` directory to learn more. Good luck, and welcome!
