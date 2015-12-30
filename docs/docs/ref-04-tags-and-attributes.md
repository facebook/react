---
id: tags-and-attributes
title: Tags and Attributes
permalink: tags-and-attributes.html
prev: component-specs.html
next: events.html
---

## Supported Tags

React attempts to support all common elements. If you need an element that isn't listed here, please [file an issue](https://github.com/facebook/react/issues/new).

### HTML Elements

The following HTML elements are supported:

```
a abbr address area article aside audio b base bdi bdo big blockquote body br
button canvas caption cite code col colgroup data datalist dd del details dfn
dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5
h6 head header hr html i iframe img input ins kbd keygen label legend li link
main map mark menu menuitem meta meter nav noscript object ol optgroup option
output p param picture pre progress q rp rt ruby s samp script section select
small source span strong style sub summary sup table tbody td textarea tfoot th
thead time title tr track u ul var video wbr
```

### SVG elements

The following SVG elements are supported:

```
circle clipPath defs ellipse g line linearGradient mask path pattern polygon polyline
radialGradient rect stop svg text tspan
```

You may also be interested in [react-art](https://github.com/facebook/react-art), a drawing library for React that can render to Canvas, SVG, or VML (for IE8).


## Supported Attributes

React supports all `data-*` and `aria-*` attributes as well as every attribute in the following lists.

> Note:
>
> All attributes are camel-cased and the attributes `class` and `for` are `className` and `htmlFor`, respectively, to match the DOM API specification.

For a list of events, see [Supported Events](/react/docs/events.html).

### HTML Attributes

These standard attributes are supported:

```
accept acceptCharset accessKey action allowFullScreen allowTransparency alt
async autoComplete autoFocus autoPlay capture cellPadding cellSpacing charSet
challenge checked classID className cols colSpan content contentEditable contextMenu
controls coords crossOrigin data dateTime defer dir disabled download draggable
encType form formAction formEncType formMethod formNoValidate formTarget frameBorder
headers height hidden high href hrefLang htmlFor httpEquiv icon id inputMode
keyParams keyType label lang list loop low manifest marginHeight marginWidth max
maxLength media mediaGroup method min minLength multiple muted name noValidate open
optimum pattern placeholder poster preload radioGroup readOnly rel required role
rows rowSpan sandbox scope scoped scrolling seamless selected shape size sizes
span spellCheck src srcDoc srcSet start step style summary tabIndex target title
type useMap value width wmode wrap
```

In addition, the following non-standard attributes are supported:

- `autoCapitalize autoCorrect` for Mobile Safari.
- `property` for [Open Graph](http://ogp.me/) meta tags.
- `itemProp itemScope itemType itemRef itemID` for [HTML5 microdata](http://schema.org/docs/gs.html).
- `unselectable` for Internet Explorer.
- `results autoSave` for WebKit/Blink input fields of type `search`.

There is also the React-specific attribute `dangerouslySetInnerHTML` ([more here](/react/docs/special-non-dom-attributes.html)), used for directly inserting HTML strings into a component.

### SVG Attributes

Any attributes passed to SVG tags are passed through without changes.

React used to support special camelCase aliases for certain SVG attributes, such as `clipPath`. If you use them now you'll see a deprecation warning. These aliases will be removed in the next version in favor of their real names from the SVG specification, such as `clip-path`. Attributes that have a camelCase name in the spec, such as `gradientTransform`, will keep their names.
