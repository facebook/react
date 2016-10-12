---
id: reference-react-dom-server
title: ReactDOMServer
permalink: docs/reference-react-dom-server.html
next: reference-react-dom-server.html
redirect_from: "/docs/reference.html"
---

The `react-dom/server` package allows you to render your components on the server.

 - [`renderToString()`](#renderToString)
 - [`renderToStaticMarkup()`](#renderToStaticMarkup)

## Reference

### `renderToString()`

```javascript
ReactDOMServer.renderToString(element)
```

Render a React element to its initial HTML. This should only be used on the server. React will return an HTML string. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.

If you call [`ReactDOM.render()`](/react/docs/reference-react-dom.html#render) on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.

* * *

### `renderToStaticMarkup()`

```javascript
ReactDOMServer.renderToStaticMarkup(element)
```

Similar to [`renderToString`](#rendertostring), except this doesn't create extra DOM attributes such as `data-react-id`, that React uses internally. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save lots of bytes.
