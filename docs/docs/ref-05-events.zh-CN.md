---
id: events-zh-CN
title: 事件系统
permalink: events-zh-CN.html
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
> React v0.12 中，事件处理程序返回 `false` 不再停止事件传播，取而代之，应该根据需要手动触发 `e.stopPropagation()` 或 `e.preventDefault()`。


## 支持的事件

React 将事件统一化，使事件在不同浏览器上有一致的属性。

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


### 键盘事件 

事件名称：

```
onKeyDown onKeyPress onKeyUp
```

属性：

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
