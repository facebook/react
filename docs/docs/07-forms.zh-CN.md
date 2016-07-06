---
id: forms-zh-CN
title: 表单组件
permalink: forms-zh-CN.html
prev: transferring-props-zh-CN.html
next: working-with-the-browser-zh-CN.html
---

诸如 `<input>`、`<textarea>`、`<option>` 这样的表单组件不同于其他组件，因为他们可以通过用户交互发生变化。这些组件提供的界面使响应用户交互的表单数据处理更加容易。

关于 `<form>` 事件详情请查看 [表单事件](/react/docs/events-zh-CN.html#form-events)。

## 交互属性

表单组件支持几个受用户交互影响的属性：

* `value`，用于 `<input>`、`<textarea>` 组件。
* `checked`，用于类型为 `checkbox` 或者 `radio` 的 `<input>` 组件。
* `selected`，用于 `<option>` 组件。

在 HTML 中，`<textarea>` 的值通过子节点设置；在 React 中则应该使用 `value` 代替。

表单组件可以通过 `onChange` 回调函数来监听组件变化。当用户做出以下交互时，`onChange` 执行并通过浏览器做出响应：

* `<input>` 或 `<textarea>` 的 `value` 发生变化时。
* `<input>` 的 `checked` 状态改变时。
* `<option>` 的 `selected` 状态改变时。

和所有 DOM 事件一样，所有的 HTML 原生组件都支持 `onChange` 属性，而且可以用来监听冒泡的 `change` 事件。

> 注意:
>
> 对于 `<input>` and `<textarea>`， `onChange` 取代 — 一般应该用来替代 — DOM内建的 [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) 事件处理。

## 受控组件

一个*受控*的 `<input>` 有一个 `value` prop。渲染一个受控 `<input>` 会反映 `value` prop 的值。

```javascript
  render: function() {
    return <input type="text" value="Hello!" />;
  }
```

用户输入在被渲染的元素里将没有作用,因为 React 已经声明值为 `Hello!`。要更新 value 来响应用户输入，你可以使用 `onChange` 事件：

```javascript
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    return (
      <input
        type="text"
        value={this.state.value}
        onChange={this.handleChange}
      />
    );
  }
```

在这个例子中，我们接受用户提供的值并更新 `<input>` 组件的 `value` prop。这个模式使实现响应或者验证用户输入的界面更容易。例如：

```javascript
  handleChange: function(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

上面的代码接受用户输入，并截取前 140 个字符。

受控组件不维持一个自己的内部状态;它单纯的基于 props 渲染。

### 复选框与单选按钮的潜在问题

当心，在力图标准化复选框与单选按钮的变换处理中，React使用`click` 事件代替 `change` 事件。在大多数情况下它们表现的如同预期，除了在`change` handler中调用`preventDefault` 。`preventDefault` 阻止了浏览器视觉上更新输入，即使`checked`被触发。变通的方式是要么移除`preventDefault`的调用，要么把`checked` 的触发放在一个`setTimeout`里。

## 不受控组件

一个没有 `value` 属性的 `<input>` 是一个不*受控*组件:

```javascript
  render: function() {
    return <input type="text" />;
  }
```

上面的代码将渲染出一个空值的输入框，用户输入将立即反应到元素上。和受控元素一样，使用 `onChange` 事件可以监听值的变化。

*不受控*组件维持它自己的内部状态。

### 默认值

如果想给组件设置一个非空的初始值，可以使用 `defaultValue` 属性。例如：

```javascript
  render: function() {
    return <input type="text" defaultValue="Hello!" />;
  }
```

这个例子会像上面的 **不受控组件** 例子一样运行。

同样的， `<input type="checkbox">` 和 `<input type="radio">` 支持 `defaultChecked` 、 `<select>` 支持 `defaultValue`.

> 注意:
>
>  `defaultValue` 和 `defaultChecked` props 只能在内部渲染时被使用。 如果你需要在随后的渲染更新值, 你需要使用 [受控组件](#受控组件).

## 高级主题

### 为什么使用受控组件？

在 React 中使用诸如 `<input>` 的表单组件时，遇到了一个在传统 HTML 中没有的挑战。比如下面的代码：

```html
  <input type="text" name="title" value="Untitled" />
```

它渲染一个*初始值*为 `Untitled` 的输入框。当用户改变输入框的值时，节点的 `value` 属性( *property*)将随之变化，但是 `node.getAttribute('value')` 还是会返回初始设置的值 `Untitled`.

与 HTML 不同，React 组件必须在任何时间点表现视图的状态，而不仅仅是在初始化时。比如在 React 中：

```javascript
  render: function() {
    return <input type="text" name="title" value="Untitled" />;
  }
```

既然这个方法描述了在任意时间点上的视图，那么文本输入框的值就应该*始终*为 `Untitled`。

### 为什么 `<textarea>` 使用 `value` 属性？

在 HTML 中， `<textarea>` 的值通常使用子节点设置：

```html
  <!-- 反例：在 React 中不要这样使用！ -->
  <textarea name="description">This is the description.</textarea>
```

对 HTML 而言，让开发者设置多行的值很容易。但是，React 是 JavaScript，没有字符串限制，可以使用 `\n` 实现换行。简言之，React 已经有 `value`、`defaultValue` 属性，`</textarea>` 组件的子节点扮演什么角色就有点模棱两可了。基于此， 设置 `<textarea>` 值时不应该使用子节点：

```javascript
  <textarea name="description" value="This is a description." />
```

如果 *非要* 使用子节点，效果和使用 `defaultValue` 一样。

### 为什么 `<select>` 使用 `value` 属性

HTML 中 `<select>` 通常使用 `<option>` 的 `selected` 属性设置选中状态；React 为了更方面的控制组件，采用以下方式代替：

```javascript
  <select value="B">
    <option value="A">Apple</option>
    <option value="B">Banana</option>
    <option value="C">Cranberry</option>
  </select>
```

如果是不受控组件，则使用 `defaultValue`。

> 注意：
>
> 给 `value` 属性传递一个数组，可以选中多个选项：`<select multiple={true} value={['B', 'C']}>`。
