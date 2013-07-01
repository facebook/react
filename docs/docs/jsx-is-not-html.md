---
id: docs-jsx-is-not-html
title: JSX is not HTML
description: Differences between JSX and HTML.
layout: docs
prev: api.html
---

JSX looks like HTML but there are some important differences you may run into.

## Whitespace removal

JSX doesn't follow the same whitespace elimination rules as HTML. JSX removes all whitespace between two curly braces expressions. If you want to have whitespace, simply add `{' '}`.

```javascript
<div>{this.props.name} {' '} {this.props.surname}</div>
```

Follow [Issue #65](https://github.com/facebook/react/issues/65) for discussion on this behavior.

## HTML Entities

You can insert HTML entities within literal text in JSX:

```javascript
<div>First &middot; Second</div>
```

If you want to display an HTML entity within dynamic content, you will run into double escaping issues as React escapes all the strings you are displaying in order to prevent a wide range of XSS attacks by default.

```javascript
// Bad: It displays "First &middot; Second"
<div>{'First &middot; Second'}</div>
```

There are various ways to work-around this issue. The easiest one is to write unicode character directly in Javascript. You need to make sure that the file is saved as UTF-8 and that the proper UTF-8 directives are set so the browser will display it correctly.

```javascript
<div>{'First · Second'}</div>
```

A safer alternative is to find the [unicode number corresponding to the entity](http://www.fileformat.info/info/unicode/char/b7/index.htm) and use it inside of a JavaScript string.

```javascript
<div>{'First \u00b7 Second'}</div>
<div>{'First ' + String.fromCharCode(183) + ' Second'}</div>
```

You can use mixed arrays with strings and JSX elements.

```javascript
<div>{['First ', <span>&middot;</span>, ' Second']}</div>
```

As a last resort, you always have the ability to insert raw HTML.

```javascript
<div dangerouslySetInnerHTML={{'{{'}}__html: 'First &middot; Second'}} />
```

## Comments

JSX supports both single-line and multi-line JavaScript comments within a tag declaration:

```javascript
<div // This is a single-line comment:
    /*
        And a multi-line
        comment
    */
/>
```

As of React 0.3, there is no good way to insert comments within the children section. [Issue #82](https://github.com/facebook/react/issues/82) is tracking progress to enable the following:

```javascript
// Note: This is not implemented yet!
<div>
  {/* This is a comment */}
</div>
```

## Custom HTML Attributes

If you pass properties to native HTML elements that do not exist in the HTML specification, React will not render them. If you want to use a custom attribute, you should prefix it with `data-`.

```javascript
<div data-custom-attribute="foo" />
```

[Web Accessibility](http://www.w3.org/WAI/intro/aria) attributes starting with `aria-` will be rendered properly.

```javascript
<div aria-hidden={true} />
```
