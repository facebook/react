---
id: events-zh-CN
title: 事件系统
permalink: docs/events-zh-CN.html
prev: tags-and-attributes-zh-CN.html
next: dom-differences-zh-CN.html
---

## 合成事件

事件处理程序通过 `合成事件`（`SyntheticEvent`）的实例传递，`SyntheticEvent` 是浏览器原生事件跨浏览器的封装。`SyntheticEvent` 和浏览器原生事件一样有 `stopPropagation()`、`preventDefault()` 接口，而且这些接口夸浏览器兼容。

如果出于某些原因想使用浏览器原生事件，可以使用 `nativeEvent` 属性获取。每个和成事件（`SyntheticEvent`）对象都有以下属性：

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

> 注意：
>
> React v0.14 中，事件处理程序返回 `false` 不再停止事件传播，取而代之，应该根据需要手动触发 `e.stopPropagation()` 或 `e.preventDefault()`。

## 事件池

`SyntheticEvent` 是池化的. 这意味着 `SyntheticEvent` 对象将会被重用并且所有的属性都会在事件回调被调用后被 nullified.
这是因为性能的原因.
因此,你不能异步的访问事件.

```javascript
function onClick(event) {
  console.log(event); // => nullified object.
  console.log(event.type); // => "click"
  var eventType = event.type; // => "click"

  setTimeout(function() {
    console.log(event.type); // => null
    console.log(eventType); // => "click"
  }, 0);

  this.setState({clickEvent: event}); // Won't work. this.state.clickEvent will only contain null values.
  this.setState({eventType: event.type}); // You can still export event properties.
}
```

> 注意:
>
> 如果你想异步访问事件属性,你应该在事件上调用 `event.persist()` ,这会从池中移除合成事件并允许对事件的引用被用会保留.

## 支持的事件

React 将事件统一化，使事件在不同浏览器上有一致的属性.

下面的事件处理程序在事件冒泡阶段被触发。如果要注册事件捕获处理程序，应该使用 `Capture` 事件，例如使用 `onClickCapture` 处理点击事件的捕获阶段，而不是 `onClick`。


### 剪贴板事件

事件名称：

```
onCopy onCut onPaste
```

属性：

```javascript
DOMDataTransfer clipboardData
```


### Composition 事件

事件名称:

```
onCompositionEnd onCompositionStart onCompositionUpdate
```

属性:

```javascript
string data

```


### 键盘事件

事件名称：

```
onKeyDown onKeyPress onKeyUp
```

属性:

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


### 焦点事件

事件名称

```
onFocus onBlur
```

属性：

```javascript
DOMEventTarget relatedTarget
```

焦点事件在所有的React DOM上工作,不仅仅是表单元素.


### 表单事件

事件名称：

```
onChange onInput onSubmit
```

关于 `onChange` 事件的更多信息，参见 [表单组件](/react/docs/forms-zh-CN.html)。


### 鼠标事件

事件名称：

```
onClick onContextMenu onDoubleClick onDrag onDragEnd onDragEnter onDragExit
onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave
onMouseMove onMouseOut onMouseOver onMouseUp
```

`onMouseEnter` 和 `onMouseLeave` 事件从离开的元素传播到进入的元素,代替冒泡排序并且没有捕获阶段. 

属性：

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


### Selection Events

事件名称:

```
onSelect
```


### 触控事件

事件名称：

```
onTouchCancel onTouchEnd onTouchMove onTouchStart
```

属性：

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


### 用户界面事件

事件名称：

```
onScroll
```

属性：

```javascript
number detail
DOMAbstractView view
```


### 滚轮事件

事件名称：

```
onWheel
```

属性：

```javascript
number deltaMode
number deltaX
number deltaY
number deltaZ
```


### 媒体事件

事件名称:

```
onAbort onCanPlay onCanPlayThrough onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate onVolumeChange onWaiting
```


### 图片事件

事件名称:

```
onLoad onError
```


### 动画事件

事件名称:

```
onAnimationStart onAnimationEnd onAnimationIteration
```

属性：

```javascript
string animationName
string pseudoElement
float elapsedTime
```


### Transition Events

事件名称:

```
onTransitionEnd
```

属性：

```javascript
string propertyName
string pseudoElement
float elapsedTime
```
