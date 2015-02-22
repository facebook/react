---
id: events-ko-KR
title: 이벤트 시스템
permalink: events-ko-KR.html
prev: tags-and-attributes-ko-KR.html
next: dom-differences-ko-KR.html
---

## 통합적인(Synthetic) 이벤트

이벤트 핸들러는 브라우저의 네이티브 이벤트의 크로스 브라우저 래퍼인`SyntheticEvent`의 인스턴스에 전달됩니다.  모든 브라우저에서 동작한다는 점을 제외하면, `SyntheticEvent`는 `stopPropagation()`나 `preventDefault()`를 포함해, 브라우저의 네이티브 이벤트와 같은 인터페이스를 가지고 있습니다.

어떤 이유로 기본 브라우저 이벤트가 필요하다면, 그냥  `nativeEvent`를 사용해 할 수 있습니다. 모든 `SyntheticEvent` 객체는 이런 어트리뷰트를 가집니다.

```javascript
boolean bubbles
boolean cancelable
DOMEventTarget currentTarget
boolean defaultPrevented
number eventPhase
boolean isTrusted
DOMEvent nativeEvent
void preventDefault()
void stopPropagation()
DOMEventTarget target
number timeStamp
string type
```

> 주의:
>
> v0.12 시점에서, 이벤트 핸들러에서 `false` 를 리턴하는 것은 더 이상 이벤트의 전달(propagation)을 멈추지 않습니다. 대신, `e.stopPropagation()`나 `e.preventDefault()`로 적절히 수동으로 트리거해야 합니다.


## 지원되는 이벤트

React는 다른 브라우저에서 일관된 특성을 가지도록 이벤트를 일반화합니다.

밑에 있는 이벤트 핸들러들은 일으키는(bubbling) 단계에서 이벤트를 트리거합니다.  이벤트 핸들러를 캡처 단계로 등록하려면, 이벤트 이름에 `Capture`를 붙이면 됩니다.  예를 들어, 캡처 단계의 클릭 이벤트를 다루려면 `onClick`를 사용하는 대신에 `onClickCapture`를 사용해야 합니다.


### 클립보드 이벤트

이벤트 이름:

```
onCopy onCut onPaste
```

프로퍼티:

```javascript
DOMDataTransfer clipboardData
```


### 키보드 이벤트

이벤트 이름:

```
onKeyDown onKeyPress onKeyUp
```

프로퍼티:

```javascript
boolean altKey
Number charCode
boolean ctrlKey
function getModifierState(key)
String key
Number keyCode
String locale
Number location
boolean metaKey
boolean repeat
boolean shiftKey
Number which
```


### 포커스 이벤트

이벤트 이름:

```
onFocus onBlur
```

프로퍼티:

```javascript
DOMEventTarget relatedTarget
```


### 폼 이벤트

이벤트 이름:

```
onChange onInput onSubmit
```

onChange 이벤트에 대한 더 자세한 정보는 [폼](/react/docs/forms-ko-KR.html)에서 확인하세요.


### 마우스 이벤트

이벤트 이름:

```
onClick onDoubleClick onDrag onDragEnd onDragEnter onDragExit onDragLeave
onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave
onMouseMove onMouseOut onMouseOver onMouseUp
```

프로퍼티:

```javascript
boolean altKey
Number button
Number buttons
Number clientX
Number clientY
boolean ctrlKey
function getModifierState(key)
boolean metaKey
Number pageX
Number pageY
DOMEventTarget relatedTarget
Number screenX
Number screenY
boolean shiftKey
```


### 터치 이벤트

터치 이벤트를 활성화 하려면, 컴포넌트를 렌더하기 전에
`React.initializeTouchEvents(true)`를 호출하세요.

이벤트 이름:

```
onTouchCancel onTouchEnd onTouchMove onTouchStart
```

프로퍼티:

```javascript
boolean altKey
DOMTouchList changedTouches
boolean ctrlKey
function getModifierState(key)
boolean metaKey
boolean shiftKey
DOMTouchList targetTouches
DOMTouchList touches
```


### UI 이벤트

이벤트 이름:

```
onScroll
```

프로퍼티:

```javascript
Number detail
DOMAbstractView view
```


### 휠 이벤트

이벤트 이름:

```
onWheel
```

프로퍼티:

```javascript
Number deltaMode
Number deltaX
Number deltaY
Number deltaZ
```
