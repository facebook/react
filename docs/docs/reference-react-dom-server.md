---
id: react-dom-server
title: ReactDOMServer
layout: docs
category: Reference
permalink: docs/react-dom-server.html
---

If you load React from a `<script>` tag, these top-level APIs are available on the `ReactDOMServer` global. If you use ES6 with npm, you can write `import ReactDOMServer from 'react-dom/server'`. If you use ES5 with npm, you can write `var ReactDOMServer = require('react-dom/server')`.

## Overview

The `ReactDOMServer` object allows you to render your components on the server.

 - [`renderToString()`](#rendertostring)
 - [`renderToStaticMarkup()`](#rendertostaticmarkup)
 - [`renderToNodeStream()`](#rendertonodestream)
 - [`renderToStaticNodeStream()`](#rendertostaticnodestream)

* * *

## Reference

### `renderToString()`

```javascript
ReactDOMServer.renderToString(element)
```

Render a React element to its initial HTML. This should only be used on the server. React will return an HTML string. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

If you call [`ReactDOM.render()`](/react/docs/react-dom.html#render) on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.

* * *

### `renderToStaticMarkup()`

```javascript
ReactDOMServer.renderToStaticMarkup(element)
```

Similar to [`renderToString`](#rendertostring), except this doesn't create extra DOM attributes such as `data-reactroot`, that React uses internally. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save lots of bytes.

* * *

### `renderToNodeStream()`

```javascript
ReactDOMServer.renderToNodeStream(element)
```

Render a React element to its initial HTML. `renderToNodeStream` will return a [Readable stream](https://nodejs.org/api/stream.html#stream_readable_streams), and the HTML output by this stream will be exactly equal to what [`renderToString`](#rendertostring) would return with the same arguments. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

This method should only be used in Node.js. It will throw an exception in the browser, since the browser does not support Node.js streams.

If you call [`ReactDOM.render()`](/react/docs/react-dom.html#render) on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.

Note that the stream returned from this method will return a byte stream encoded in utf-8. If you need a stream in another encoding, take a look a project like [iconv-lite](https://www.npmjs.com/package/iconv-lite), which provides transform streams for transcoding text.

* * *

### `renderToStaticNodeStream()`

```javascript
ReactDOMServer.renderToStaticNodeStream(element)
```

Similar to [`renderToNodeStream`](#rendertonodestream), except this doesn't create extra DOM attributes such as `data-reactroot`, that React uses internally. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save lots of bytes.

This method should only be used in Node.js. It will throw an exception in the browser, since the browser does not support Node.js streams.

Note that the stream returned from this method will return a byte stream encoded in utf-8. If you need a stream in another encoding, take a look a project like [iconv-lite](https://www.npmjs.com/package/iconv-lite), which provides transform streams for transcoding text.
