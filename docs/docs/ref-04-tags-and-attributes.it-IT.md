---
id: tags-and-attributes-it-IT
title: Tag e Attributi
permalink: tags-and-attributes-it-IT.html
prev: component-specs-it-IT.html
next: events-it-IT.html
---

## Tag Supportati

React tenta di supportare tutti gli elementi comuni. Se hai bisogno di un elemento che non è elencato di seguito, per favore [apri una issue](https://github.com/facebook/react/issues/new).

### Elementi HTML

I seguenti elementi HTML sono supportati:

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

### Elementi SVG

I seguenti elementi SVG sono supportati:

```
circle clipPath defs ellipse g line linearGradient mask path pattern polygon polyline
radialGradient rect stop svg text tspan
```

Potresti trovare utile [react-art](https://github.com/facebook/react-art), una libreria di disegno per React che può disegnare su Canvas, SVG oppure VML (per IE8).


## Attributi Supportati

React supporta tutti gli attributi `data-*` e `aria-*`, oltre a ciascun attributo nelle liste seguenti.

> Nota:
>
> Tutti gli attributi sono camel-cased, e gli attributi `class` e `for` sono resi come `className` e `htmlFor` rispettivamente, per adeguarsi alla specifica delle API del DOM.

Per una lista di eventi, consulta gli [Eventi Supportati](/react/docs/events.html).

### Attributi HTML

Questi attributi standard sono supportati:

```
accept acceptCharset accessKey action allowFullScreen allowTransparency alt
async autoComplete autoFocus autoPlay capture cellPadding cellSpacing challenge
charSet checked cite classID className colSpan cols content contentEditable
contextMenu controls coords crossOrigin data dateTime default defer dir
disabled download draggable encType form formAction formEncType formMethod
formNoValidate formTarget frameBorder headers height hidden high href hrefLang
htmlFor httpEquiv icon id inputMode integrity is keyParams keyType kind label
lang list loop low manifest marginHeight marginWidth max maxLength media
mediaGroup method min minLength multiple muted name noValidate nonce open
optimum pattern placeholder poster preload profile radioGroup readOnly rel
required reversed role rowSpan rows sandbox scope scoped scrolling seamless
selected shape size sizes span spellCheck src srcDoc srcLang srcSet start step
style summary tabIndex target title type useMap value width wmode wrap
```

In aggiunta, i seguenti attributi non-standard sono supportati:

- `autoCapitalize autoCorrect` per Mobile Safari.
- `property` per i meta tag [Open Graph](http://ogp.me/).
- `itemProp itemScope itemType itemRef itemID` per i [microdata HTML5](http://schema.org/docs/gs.html).
- `unselectable` per Internet Explorer.
- `results autoSave` per campi di input del tipo `search` in WebKit/Blink.

Esiste anche l'attributo specifico di React `dangerouslySetInnerHTML` ([maggiori informazioni](/react/docs/special-non-dom-attributes.html)), usato per inserire direttamente stringhe di HTML in un componente.

### Attributi SVG

```
accentHeight accumulate additive alignmentBaseline allowReorder alphabetic
amplitude arabicForm ascent attributeName attributeType autoReverse azimuth
baseFrequency baseProfile baselineShift bbox begin bias by calcMode capHeight
clip clipPath clipPathUnits clipRule colorInterpolation
colorInterpolationFilters colorProfile colorRendering contentScriptType
contentStyleType cursor cx cy d decelerate descent diffuseConstant direction
display divisor dominantBaseline dur dx dy edgeMode elevation enableBackground
end exponent externalResourcesRequired fill fillOpacity fillRule filter
filterRes filterUnits floodColor floodOpacity focusable fontFamily fontSize
fontSizeAdjust fontStretch fontStyle fontVariant fontWeight format from fx fy
g1 g2 glyphName glyphOrientationHorizontal glyphOrientationVertical glyphRef
gradientTransform gradientUnits hanging horizAdvX horizOriginX ideographic
imageRendering in in2 intercept k k1 k2 k3 k4 kernelMatrix kernelUnitLength
kerning keyPoints keySplines keyTimes lengthAdjust letterSpacing lightingColor
limitingConeAngle local markerEnd markerHeight markerMid markerStart
markerUnits markerWidth mask maskContentUnits maskUnits mathematical mode
numOctaves offset opacity operator order orient orientation origin overflow
overlinePosition overlineThickness paintOrder panose1 pathLength
patternContentUnits patternTransform patternUnits pointerEvents points
pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits
r radius refX refY renderingIntent repeatCount repeatDur requiredExtensions
requiredFeatures restart result rotate rx ry scale seed shapeRendering slope
spacing specularConstant specularExponent speed spreadMethod startOffset
stdDeviation stemh stemv stitchTiles stopColor stopOpacity
strikethroughPosition strikethroughThickness string stroke strokeDasharray
strokeDashoffset strokeLinecap strokeLinejoin strokeMiterlimit strokeOpacity
strokeWidth surfaceScale systemLanguage tableValues targetX targetY textAnchor
textDecoration textLength textRendering to transform u1 u2 underlinePosition
underlineThickness unicode unicodeBidi unicodeRange unitsPerEm vAlphabetic
vHanging vIdeographic vMathematical values vectorEffect version vertAdvY
vertOriginX vertOriginY viewBox viewTarget visibility widths wordSpacing
writingMode x x1 x2 xChannelSelector xHeight xlinkActuate xlinkArcrole
xlinkHref xlinkRole xlinkShow xlinkTitle xlinkType xmlBase xmlLang xmlSpace
y y1 y2 yChannelSelector z zoomAndPan
```
