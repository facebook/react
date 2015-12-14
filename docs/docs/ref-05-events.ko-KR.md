---
id: events-ko-KR
title: 이벤트 시스템
permalink: events-ko-KR.html
prev: tags-and-attributes-ko-KR.html
next: dom-differences-ko-KR.html
---

## 통합적인(Synthetic) 이벤트

이벤트 핸들러는 브라우저의 네이티브 이벤트의 크로스 브라우저 래퍼(wrapper)인`SyntheticEvent`의 인스턴스에 전달됩니다. 모든 브라우저에서 동작한다는 점을 제외하면, `SyntheticEvent`는 `stopPropagation()`나 `preventDefault()`를 포함해, 브라우저의 네이티브 이벤트와 같은 인터페이스를 가지고 있습니다.

어떤 이유로 기본 브라우저 이벤트가 필요하다면, 그냥 `nativeEvent`를 사용해 할 수 있습니다. 모든 `SyntheticEvent` 객체는 이런 어트리뷰트를 가집니다.

```javascript
boolean bubbles
boolean cancelable
DOMEventTarget currentTarget
boolean defaultPrevented
number eventPhase
boolean isTrusted
DOMEvent nativeEvent
void preventDefault()
boolean isDefaultPrevented()
void stopPropagation()
boolean isPropagationStopped()
DOMEventTarget target
number timeStamp
string type
```

> 주의:
>
> v0.14 시점에서, 이벤트 핸들러에서 `false` 를 리턴하는 것은 더 이상 이벤트의 전달(propagation)을 멈추지 않습니다. 대신, `e.stopPropagation()`나 `e.preventDefault()`로 적절히 수동으로 트리거해야 합니다.

## 이벤트 풀링

`SyntheticEvent`는 풀링됩니다. 이는 `SyntheticEvent` 객체가 재사용될 것이며 이벤트 콜백이 호출된 후 모든 프로퍼티가 null 값을 갖게 된다는 것을 뜻합니다.
이는 성능을 위한 동작입니다.
이 때문에, 비동기 방식으로는 이벤트에 접근할 수 없습니다.

```javascript
function onClick(event) {
  console.log(event); // => null이 된 객체.
  console.log(event.type); // => "click"
  var eventType = event.type; // => "click"

  setTimeout(function() {
    console.log(event.type); // => null
    console.log(eventType); // => "click"
  }, 0);

  this.setState({clickEvent: event}); // 작동하지 않습니다. this.state.clickEvent 는 null값들만을 갖고 있습니다.
  this.setState({eventType: event.type}); // 여전히 이벤트 프로퍼티를 내보낼 수 있습니다.
}
```

> 주의:
>
> 만약 비동기 방식으로 이벤트 프로퍼티에 접근하길 원한다면, 이벤트의 `event.persist()`를 호출해야 합니다, 이는 풀로부터 통합적인 이벤트를 제거하고 이벤트에 대한 참조는 사용자의 코드에 의해 유지 될 수 있도록 합니다.

## 지원되는 이벤트

React는 다른 브라우저에서 일관된 특성을 가지도록 이벤트를 일반화합니다.

밑에 있는 이벤트 핸들러들은 일으키는(bubbling) 단계에서 이벤트를 트리거합니다. 이벤트 핸들러를 캡처 단계로 등록하려면, 이벤트 이름에 `Capture`를 붙이면 됩니다.  예를 들어, 캡처 단계의 클릭 이벤트를 다루려면 `onClick`를 사용하는 대신에 `onClickCapture`를 사용해야 합니다.


### 클립보드 이벤트

이벤트 이름:

```
onCopy onCut onPaste
```

프로퍼티:

```javascript
DOMDataTransfer clipboardData
```


### Composition Events

이벤트 이름:

```
onCompositionEnd onCompositionStart onCompositionUpdate
```

프로퍼티:

```javascript
string data

```


### 키보드 이벤트

이벤트 이름:

```
onKeyDown onKeyPress onKeyUp
```

프로퍼티:

```javascript
boolean altKey
number charCode
boolean ctrlKey
boolean getModifierState(key)
string key
number keyCode
string locale
number location
boolean metaKey
boolean repeat
boolean shiftKey
number which
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

이 포커스 이벤트는 폼 엘리먼트뿐만 아니라 모든 React DOM 엘리먼트에서 작동합니다.

<a name="form-events"></a>
### 폼 이벤트

이벤트 이름:

```
onChange onInput onSubmit
```

onChange 이벤트에 대한 더 자세한 정보는 [폼](/react/docs/forms-ko-KR.html)에서 확인하세요.


### 마우스 이벤트

이벤트 이름:

```
onClick onContextMenu onDoubleClick onDrag onDragEnd onDragEnter onDragExit
onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave
onMouseMove onMouseOut onMouseOver onMouseUp
```

`onMouseEnter`와 `onMouseLeave` 이벤트는 평범하게 일어나는(bubbling) 대신 입력된 엘리먼트에 남겨지도록 엘리먼트에서 전달되고 캡쳐 단계가 없습니다.

프로퍼티:

```javascript
boolean altKey
number button
number buttons
number clientX
number clientY
boolean ctrlKey
boolean getModifierState(key)
boolean metaKey
number pageX
number pageY
DOMEventTarget relatedTarget
number screenX
number screenY
boolean shiftKey
```


### 셀렉션 이벤트

이벤트 이름:

```
onSelect
```


### 터치 이벤트

이벤트 이름:

```
onTouchCancel onTouchEnd onTouchMove onTouchStart
```

프로퍼티:

```javascript
boolean altKey
DOMTouchList changedTouches
boolean ctrlKey
boolean getModifierState(key)
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
number detail
DOMAbstractView view
```


### 휠 이벤트

이벤트 이름:

```
onWheel
```

프로퍼티:

```javascript
number deltaMode
number deltaX
number deltaY
number deltaZ
```

### 미디어 이벤트

이벤트 이름:

```
onAbort onCanPlay onCanPlayThrough onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate onVolumeChange onWaiting
```

### 이미지 이벤트

이벤트 이름:

```
onLoad onError
```
