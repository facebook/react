---
id: tags-and-attributes-zh-CN
title: Tags和属性
permalink: tags-and-attributes-zh-CN.html
prev: component-specs-zh-CN.html
next: events-zh-CN.html
---

## 支持的Tags

React试着支持所有常见的元素.如果你需要一个没有列在这里的元素,请 [file an issue](https://github.com/facebook/react/issues/new).

### HTML 元素

下面的HTML是被支持的:

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

### SVG 元素

下面的 SVG 元素是被支持的:

```
circle clipPath defs ellipse g image line linearGradient mask path pattern
polygon polyline radialGradient rect stop svg text tspan
```

你也许对 [react-art](https://github.com/facebook/react-art)有兴趣,一个让React绘制Canvas, SVG, 或者 VML (for IE8) 的绘制库.


## 支持的属性

React支持所有的 `data-*` 和 `aria-*` 以及下列的属性.

> 注意:
>
> 所有的属性都是 camel-cased ,`class` 和 `for` 分别是 `className` 和 `htmlFor`,来符合DOM API 规范.

关于事件的列表,见 [Supported Events](/react/docs/events.html).

### HTML 属性

下面的标准属性是被支持的:

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

这些RDFa属性是被支持的 （许多RDFa属性和标准的HTML属性重叠，因此被从这个列表里去除）：

```
about datatype inlist prefix property resource typeof vocab
```

另外,支持下面的非标准属性:

- `autoCapitalize autoCorrect` for Mobile Safari.
- `color` for `<link rel="mask-icon" />` in Safari.
- `itemProp itemScope itemType itemRef itemID` for [HTML5 microdata](http://schema.org/docs/gs.html).
- `security` 老的IE浏览器.
- `unselectable` IE浏览器.
- `results autoSave` for WebKit/Blink input fields of type `search`.

同样有React规范的属性 `dangerouslySetInnerHTML` ([more here](/react/docs/special-non-dom-attributes.html)),用于直接插入HTML字符串到组件里.

### SVG 属性

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
