---
title: "Introducing React's Error Code System"
author: [keyanzhang]
---

Building a better developer experience has been one of the things that React deeply cares about, and a crucial part of it is to detect anti-patterns/potential errors early and provide helpful error messages when things (may) go wrong. However, most of these only exist in development mode; in production, we avoid having extra expensive assertions and sending down full error messages in order to reduce the number of bytes sent over the wire.

Prior to this release, we stripped out error messages at build-time and this is why you might have seen this message in production:

> Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.

In order to make debugging in production easier, we're introducing an Error Code System in [15.2.0](https://github.com/facebook/react/releases/tag/v15.2.0). We developed a [gulp script](https://github.com/facebook/react/blob/master/scripts/error-codes/gulp-extract-errors.js) that collects all of our `invariant` error messages and folds them to a [JSON file](https://github.com/facebook/react/blob/master/scripts/error-codes/codes.json), and at build-time Babel uses the JSON to [rewrite](https://github.com/facebook/react/blob/master/scripts/error-codes/replace-invariant-error-codes.js) our `invariant` calls in production to reference the corresponding error IDs. Now when things go wrong in production, the error that React throws will contain a URL with an error ID and relevant information. The URL will point you to a page in our documentation where the original error message gets reassembled.

While we hope you don't see errors often, you can see how it works [here](/docs/error-decoder.html?invariant=109&args[]=Foo). This is what the same error from above will look like:

> Minified React error #109; visit https://reactjs.org/docs/error-decoder.html?invariant=109&args[]=Foo for the full message or use the non-minified dev environment for full errors and additional helpful warnings.

We do this so that the developer experience is as good as possible, while also keeping the production bundle size as small as possible. This feature shouldn't require any changes on your side — use the `min.js` files in production or bundle your application code with `process.env.NODE_ENV === 'production'` and you should be good to go!
