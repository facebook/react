---
id: tags-and-attributes
title: Tags and Attributes
permalink: tags-and-attributes.html
prev: component-specs.html
next: events.html
---

## Supported Tags

React attempts to support all common elements. If you need an element that isn't listed here, please file an issue.

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
circle defs ellipse g line linearGradient mask path pattern polygon polyline
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
async autoComplete autoPlay cellPadding cellSpacing charSet checked classID
className cols colSpan content contentEditable contextMenu controls coords
crossOrigin data dateTime defer dir disabled download draggable encType form
formAction formEncType formMethod formNoValidate formTarget frameBorder height
hidden href hrefLang htmlFor httpEquiv icon id label lang list loop manifest
marginHeight marginWidth max maxLength media mediaGroup method min multiple
muted name noValidate open pattern placeholder poster preload radioGroup
readOnly rel required role rows rowSpan sandbox scope scrolling seamless
selected shape size sizes span spellCheck src srcDoc srcSet start step style
tabIndex target title type useMap value width wmode
```

In addition, the following non-standard attributes are supported:

- `autoCapitalize autoCorrect` for Mobile Safari.
- `property` for [Open Graph](http://ogp.me/) meta tags.
- `itemProp itemScope itemType` for [HTML5 microdata](http://schema.org/docs/gs.html).

There is also the React-specific attribute `dangerouslySetInnerHTML` ([more here](/react/docs/special-non-dom-attributes.html)), used for directly inserting HTML strings into a component.

### SVG Attributes

```
cx cy d dx dy fill fillOpacity fontFamily fontSize fx fy gradientTransform
gradientUnits markerEnd markerMid markerStart offset opacity
patternContentUnits patternUnits points preserveAspectRatio r rx ry
spreadMethod stopColor stopOpacity stroke strokeDasharray strokeLinecap
strokeOpacity strokeWidth textAnchor transform version viewBox x1 x2 x y1 y2 y
```
