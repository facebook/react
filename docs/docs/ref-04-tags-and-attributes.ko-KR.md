---
id: tags-and-attributes-ko-KR
title: 태그와 어트리뷰트
permalink: docs/tags-and-attributes-ko-KR.html
prev: component-specs-ko-KR.html
next: events-ko-KR.html
---

## 지원되는 태그

React는 모든 공통 엘리먼트를 지원하려 합니다. 필요한 엘리먼트가 목록에 없다면, [이슈로 등록](https://github.com/facebook/react/issues/new)해 주세요.

### HTML 엘리먼트

다음의 HTML 엘리먼트가 지원됩니다.

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

### SVG 엘리먼트

다음의 SVG 엘리먼트가 지원됩니다.

```
circle clipPath defs ellipse g line linearGradient mask path pattern polygon polyline
radialGradient rect stop svg text tspan
```

아마 Canvas, SVG, VML(IE8 전용)에 렌더할 때 쓰는 React의 드로잉 라이브러리인 [react-art](https://github.com/facebook/react-art)도 흥미 있으실 수 있습니다.


## 지원되는 어트리뷰트

React는 모든 `data-*`, `aria-*` 어트리뷰트와 밑에 있는 모든 어트리뷰트를 지원합니다.

> 주의:
>
> 모든 어트리뷰트는 카멜케이스이고, `class` `for` 어트리뷰트는 각각  DOM API의 사양에 맞춰서 `className` `htmlFor` 가 됩니다.

이벤트의 목록을 보시려면 [지원되는 이벤트](/react/docs/events-ko-KR.html)를 확인하세요.

### HTML 어트리뷰트

이런 표준 어트리뷰트가 지원됩니다.

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

덧붙여, 이런 비표준 어트리뷰트도 지원됩니다.

- 모바일 사파리를 위한 `autoCapitalize autoCorrect`.
- [오픈 그래프](http://ogp.me/) 메타 태그를 위한 `property`.
- [HTML5 마이크로데이터](http://schema.org/docs/gs.html)를 위한 `itemProp itemScope itemType itemRef itemID`.
- 인터넷 익스플로어를 위한 `unselectable`.
- WebKit/Blink의 `search` 타입 input 필드를 위한 `results autoSave` 

컴포넌트에 직접 HTML 문자열을 넣을 때 사용하는, React 전용 어트리뷰트 `dangerouslySetInnerHTML`([자세한 정보는 여기](/react/docs/special-non-dom-attributes-ko-KR.html))도 있습니다.

### SVG 어트리뷰트

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
