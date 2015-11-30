---
id: dangerously-set-inner-html
title: Dangerously Set innerHTML
layout: tips
permalink: dangerously-set-inner-html.html
prev: children-undefined.html
---

Improper use of the `innerHTML` can open you up to a [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) attack.  Sanitizing user input for display is notoriously error-prone, and failure to properly sanitize is one of the [leading causes of web vulnerabilities](https://owasptop10.googlecode.com/files/OWASP%20Top%2010%20-%202013.pdf) on the internet.

Our design philosophy is that it should be “easy” to make things safe, and developers should explicitly state their intent when performing “unsafe” operations.  The prop name `dangerouslySetInnerHTML` is intentionally chosen to be frightening, and the prop value (an object instead of a string) can be used to indicate sanitized data.

After fully understanding the security ramifications and properly sanitizing the data, create a new object containing only the key `__html` and your sanitized data as the value.  Here is an example using the JSX syntax:

```js
function createMarkup() { return {__html: 'First &middot; Second'}; };
<div dangerouslySetInnerHTML={createMarkup()} />
```

The point being that if you unintentionally do say `<div dangerouslySetInnerHTML={getUsername()} />` it will not be rendered because `getUsername()` would return a plain `string` and not a `{__html: ''}` object.  The intent behind the `{__html:...}` syntax is that it be considered a "type/taint" of sorts.  Sanitized data can be returned from a function using this wrapper object, and this marked data can subsequently be passed into `dangerouslySetInnerHTML`.  For this reason, we recommend against writing code of the form `<div dangerouslySetInnerHTML={{'{{'}}__html: getMarkup()}} />`.

This functionality is mainly provided for cooperation with DOM string manipulation libraries, so the HTML provided must be well-formed (ie., pass XML validation).

For a more complete usage example, refer to the last example on the [front page](/react/).
