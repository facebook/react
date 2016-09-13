---
id: dangerously-set-inner-html
title: Dangerously Set innerHTML
layout: tips
permalink: tips/dangerously-set-inner-html.html
prev: children-undefined.html
---

Improper use of the `innerHTML` can open you up to a [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) attack.  Sanitizing user input for display is notoriously error-prone, and failure to properly sanitize is one of the [leading causes of web vulnerabilities](https://owasptop10.googlecode.com/files/OWASP%20Top%2010%20-%202013.pdf) on the Internet.

Our design philosophy is that it should be “easy” to make things safe, and developers should explicitly state their intent when performing “unsafe” operations.  The prop name `dangerouslySetInnerHTML` is intentionally chosen to be frightening, and the prop value (an object instead of a string) can be used to indicate sanitized data.

After fully understanding the security ramifications and properly sanitizing the data, create a new object containing only the key `__html` and your sanitized data as the value.  Here is an example using the JSX syntax:

```js
function createMarkup() { return {__html: 'First &middot; Second'}; };
<div dangerouslySetInnerHTML={createMarkup()} />
```

The intent behind the `{__html:...}` syntax is to ensure that the developer has taken the necessary steps to sanitize the data to be rendered. The point being that if you unintentionally say `<div dangerouslySetInnerHTML={getUsername()} />`, it will not be rendered because `getUsername()` would return a plain `string` and not a `{__html: ''}` object. This prevents unsanitized data from being rendered and acts as a form of [taint checking](https://en.wikipedia.org/wiki/Taint_checking). Sanitized data can be returned from a function using this wrapper object, and this marked data can subsequently be passed into `dangerouslySetInnerHTML`.  For this reason, we recommend against writing code of the form `<div dangerouslySetInnerHTML={{'{{'}}__html: getMarkup()}} />`. 

> Note: The HTML provided within the `{__html: ...}` object must be well-formed (ie., pass XML validation) in order to cooperate with DOM string manipulation libraries.

For a more complete usage example, refer to the last example on the [front page](/react/).
