---
id: tags-and-attributes
title: Tags and Attributes
layout: docs
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
div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6
head header hr html i iframe img input ins kbd keygen label legend li link main
map mark menu menuitem meta meter nav noscript object ol optgroup option output
p param pre progress q rp rt ruby s samp script section select small source
span strong style sub summary sup table tbody td textarea tfoot th thead time
title tr track u ul var video wbr
```

### SVG elements

The following SVG elements are supported:

```
altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion animateTransform circle clipPath color-profile cursor defs desc feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font font-face font-face-format font-face-name font-face-src font-face-uri foreignObject g glyph glyphRef hkern image line linearGradient marker mask metadata missing-glyph mpath path pattern polygon polyline radialGradient rect set stop switch symbol svg text textPath tref tspan use view vkern

```

You may also be interested in [react-art](https://github.com/facebook/react-art), a drawing library for React that can render to Canvas, SVG, or VML (for IE8).


## Supported Attributes

React supports all `data-*` and `aria-*` attributes as well as every attribute in the following lists.

> Note:
>
> All attributes are camel-cased and the attributes `class` and `for` are `className` and `htmlFor`, respectively, to match the DOM API specification.

For a list of events, see [Supported Events](/react/docs/events.html).

### HTML Attributes

```
accept accessKey action allowFullScreen allowTransparency alt autoCapitalize
autoComplete autoFocus autoPlay cellPadding cellSpacing charSet checked
className colSpan content contentEditable contextMenu controls data dateTime
dir disabled draggable encType form frameBorder height hidden href htmlFor
httpEquiv icon id label lang list loop max maxLength method min multiple name
pattern placeholder poster preload radioGroup readOnly rel required role
rowSpan scrollLeft scrollTop selected size spellCheck src step style tabIndex
target title type value width wmode
```

The non-standard `autoCapitalize` attribute is supported for Mobile Safari.

In addition, there is the React-specific attribute `dangerouslySetInnerHTML` ([more here](/react/docs/special-non-dom-attributes.html)), used for directly inserting DOM strings into a component.

### SVG Attributes

> Note:
>
> The `svgIn` attribute corresponds to the `in` attribute.

```
accentHeight accumulate additive alphabetic amplitude arabicForm ascent attributeName attributeType azimuth baseFrequency baseProfile bbox begin bias by calcMode capHeight clipPathUnits contentScriptType contentStyleType cursor cx cy d descent diffuseConstant divisor dur dx dy edgeMode elevation end exponent externalResourcesRequired filterRes filterUnits format from fx fy g1 g2 glyphName glyphRef gradientTransform gradientUnits hanging horizAdvX horizOriginX horixOriginY ideographic in2 intercept k k1 k2 k3 k4 kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle local markerHeight markerUnits markerWidth maskContentUnits maskUnits mathematical media mode numOctaves offset operator order orient orientation origin overlinePosition overlineThcikness panose1 path pathLength patternContentUnits patternTransform patternUnits points pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits r radius refX refY renderingIntent repeatCount repeatDur repeatExtensions requiredExtensions requiredFeatures restart result rotate rx ry scale seed slope spacing specularConstant specularExponent spreadMethod startOffset stdDeviation stemh stemv stitchTiles strikethroughPosition strikethroughThickness string surfaceScale svgIn systemLanguage tableValues targetX targetY textLength to transform u1 u2 underlinePosition underlineThickness unicode unicodeRange unitsPerEm vAlphabetic vHanging vIdeographic vMathematical values version vertAdvY vertOriginX vertOriginY viewBox viewTarget widths x1 x2 x xHeight xChannelSelector xlinkActuate xlinkArcrole xlinkHref xlinkShow xlinkTitle xlinkType xmlBase xmlLang xmlSpace y1 y2 y yChannelSelector z zoomAndPan
```
