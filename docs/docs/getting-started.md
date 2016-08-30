---
id: getting-started
title: Getting Started
permalink: docs/getting-started.html
next: tutorial.html
redirect_from: "docs/index.html"
---

## JSFiddle

The easiest way to start hacking on React is using the following JSFiddle Hello World examples:

 * **[React JSFiddle](https://jsfiddle.net/reactjs/69z2wepo/)**
 * [React JSFiddle without JSX](https://jsfiddle.net/reactjs/5vjqabv3/)


## Starter Pack

If you're just getting started, you can download the starter kit. The starter kit includes prebuilt copies of React and React DOM for the browser, as well as a collection of usage examples to help you get started.

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

In the root directory of the starter kit, create a `helloworld.html` with the following contents.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <script src="build/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">
      ReactDOM.render(
        <h1>Hello, world!</h1>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```

The XML syntax inside of JavaScript is called JSX; check out the [JSX syntax](/react/docs/jsx-in-depth.html) to learn more about it. In order to translate it to vanilla JavaScript we use `<script type="text/babel">` and include Babel to actually perform the transformation in the browser. Open the html from a browser and you should already be able to see the greeting!

### Separate File

Your React JSX code can live in a separate file. Create the following `src/helloworld.js`.

```javascript
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('example')
);
```

Then reference it from `helloworld.html`:

```html{10}
<script type="text/babel" src="src/helloworld.js"></script>
```

Note that some browsers (Chrome, e.g.) will fail to load the file unless it's served via HTTP.

## Using React with npm or Bower

You can also use React with package managers like npm or Bower. You can learn more in our [Package Managers](/react/docs/package-management.html) section.

## Next Steps

Check out [the tutorial](/react/docs/tutorial.html) and the other examples in the starter kit's `examples` directory to learn more.

Good luck, and welcome!
