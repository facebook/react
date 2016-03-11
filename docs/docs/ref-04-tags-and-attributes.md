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
h6 head header hgroup hr html i iframe img input ins kbd keygen label legend li
link main map mark menu menuitem meta meter nav noscript object ol optgroup
option output p param picture pre progress q rp rt ruby s samp script section
select small source span strong style sub summary sup table tbody td textarea
tfoot th thead time title tr track u ul var video wbr
```

### SVG elements

The following SVG elements are supported:

```
circle clipPath defs ellipse g image line linearGradient mask path pattern
polygon polyline radialGradient rect stop svg text tspan
```

You may also be interested in [react-art](https://github.com/facebook/react-art), a cross-browser drawing library for React.


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
async autoComplete autoFocus autoPlay capture cellPadding cellSpacing challenge
charSet checked classID className colSpan cols content contentEditable
contextMenu controls coords crossOrigin data dateTime default defer dir
disabled download draggable encType form formAction formEncType formMethod
formNoValidate formTarget frameBorder headers height hidden high href hrefLang
htmlFor httpEquiv icon id inputMode integrity is keyParams keyType kind label
lang list loop low manifest marginHeight marginWidth max maxLength media
mediaGroup method min minLength multiple muted name noValidate nonce open
optimum pattern placeholder poster preload radioGroup readOnly rel required
reversed role rowSpan rows sandbox scope scoped scrolling seamless selected
shape size sizes span spellCheck src srcDoc srcLang srcSet start step style
summary tabIndex target title type useMap value width wmode wrap
```

These RDFa attributes are supported (several RDFa attributes overlap with standard HTML attributes and thus are excluded from this list):

```
about datatype inlist prefix property resource typeof vocab
```

In addition, the following non-standard attributes are supported:

- `autoCapitalize autoCorrect` for Mobile Safari.
- `color` for `<link rel="mask-icon" />` in Safari.
- `itemProp itemScope itemType itemRef itemID` for [HTML5 microdata](http://schema.org/docs/gs.html).
- `security` for older versions of Internet Explorer.
- `unselectable` for Internet Explorer.
- `results autoSave` for WebKit/Blink input fields of type `search`.

There is also the React-specific attribute `dangerouslySetInnerHTML` ([more here](/react/docs/special-non-dom-attributes.html)), used for directly inserting HTML strings into a component.

### SVG Attributes

```
clipPath cx cy d dx dy fill fillOpacity fontFamily
fontSize fx fy gradientTransform gradientUnits markerEnd
markerMid markerStart offset opacity patternContentUnits
patternUnits points preserveAspectRatio r rx ry spreadMethod
stopColor stopOpacity stroke  strokeDasharray strokeLinecap
strokeOpacity strokeWidth textAnchor transform version
viewBox x1 x2 x xlinkActuate xlinkArcrole xlinkHref xlinkRole
xlinkShow xlinkTitle xlinkType xmlBase xmlLang xmlSpace y1 y2 y
```
