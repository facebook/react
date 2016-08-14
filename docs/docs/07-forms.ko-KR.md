---
id: forms-ko-KR
title: 폼
permalink: docs/forms-ko-KR.html
prev: transferring-props-ko-KR.html
next: working-with-the-browser-ko-KR.html
---

`<input>`, `<textarea>`, `<option>` 같은 폼 컴포넌트는 다른 네이티브 컴포넌트와 다릅니다. 왜냐하면, 사용자의 상호작용에 의해 변경될 수 있기 때문이죠. 이런 컴포넌트들은 사용자의 상호작용에 반응하여 폼을 더 쉽게 관리할 수 있도록 인터페이스를 제공합니다.

`<form>` 이벤트에 관한 정보는 [폼 이벤트](/react/docs/events-ko-KR.html#폼-이벤트)를 보세요.

## Props의 상호작용

폼 컴포넌트는 사용자 상호작용을 통해 영향을 받는 몇 가지 props를 지원합니다.

* `value`: `<input>`, `<textarea>` 컴포넌트에서 사용가능.
* `checked`: `checkbox`, `radio`타입의 `<input>` 컴포넌트에서 사용가능.
* `selected`: `<option>` 컴포넌트에서 사용가능.

HTML에서는 `<textarea>` 태그의 값을 설정할 때 `<textarea>` 태그의 자식이 사용되지만, React에서는 `value` 를 사용해야 합니다.

폼 컴포넌트는 `onChange` prop의 콜백을 설정하여 변경을 감시(listening)할 수 있습니다. `onChange` prop는 브라우저에 관계없이 다음과 같은 사용자 상호작용에 반응합니다.

* `<input>`, `<textarea>`의 `value` 변경.
* `<input>`의 `checked` state 변경.
* `<option>`의 `selected` state 변경.

모든 DOM 이벤트처럼 `onChange` prop은 모든 네이티브 컴포넌트에서 지원되며 일어난(bubbled) 변경 이벤트를 감시하는데 사용할 수 있습니다.

> 주의:
>
> `<input>`, `<textarea>`에서는 `onChange`가 DOM의 [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) 이벤트 핸들러와 같은 기능을 제공하므로 일반적인 경우에는 `onChange`를 사용하세요.

## 제어되는(controlled) 컴포넌트

`value`가 설정된 `<input>`은 *제어되는* 컴포넌트입니다. 제어되는 `<input>`에서, 렌더 엘리먼트의 값은 항상 `value` prop을 반영합니다. 예를 들어,

```javascript
  render: function() {
    return <input type="text" value="Hello!" />;
  }
```

이것은 항상 `Hello!`의 값을 가지는 input을 렌더합니다. 어떤 사용자 입력도 렌더된 엘리먼트에는 영향을 주지 않는데, 왜냐하면 React가 값을 `Hello!`로 설정했기 때문입니다. 사용자 입력에 따라 값을 업데이트하길 원한다면, `onChange` 이벤트를 사용할 수 있습니다.

```javascript
  getInitialState: function() {
    return {value: 'Hello!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <input type="text" value={value} onChange={this.handleChange} />;
  }
```

이 예제에서는, 단순히 사용자가 주는 최신값을 받고 `<input>` 컴포넌트의 `value` prop을 업데이트하고 있습니다. 이 패턴은 사용자의 상호작용에 반응하거나 검증하는 인터페이스를 쉽게 구현하게 합니다. 예를 들어,

```javascript
  handleChange: function(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

이것은 사용자 입력을 받아들이지만, 시작에서부터 140자로 값을 자릅니다.

### 체크박스와 라디오 버튼의 잠제적인 문제

변경 핸들링을 일반화하기 위해 React는 `change` 이벤트 대신에 `click` 이벤트를 사용하는 것에 주의하세요. `change` 핸들러 안에서 `preventDefault`를 호출하는 경우를 재외하고 이 동작은 예상대로 동작합니다. 이런 경우 `preventDefault`를 제거하거나,  `setTimeout`에 `checked`의 전환을 넣어서 해결 가능합니다.

## 제어되지 않는(Uncontrolled) 컴포넌트

`value` 가 없(거나 `null`로 설정되어 있)는 `<input>`은 *제어되지 않는* 컴포넌트입니다. 제어되지 않는 `<input>`에서 렌더된 엘리먼트의 value값은 사용자의 입력을 반영합니다. 예를 들어,

```javascript
  render: function() {
    return <input type="text" />;
  }
```

이것은 빈 값으로 시작되는 input을 렌더합니다. 임의의 사용자 입력은 즉시 렌더된 엘리먼트에 반영됩니다. 값의 업데이트를 감시하길 원한다면, 제어되는 컴포넌트처럼 `onChange` 이벤트를 사용할 수 있습니다.

### 기본 값

비어 있지 않은 값으로 초기화하길 원한다면, `defaultValue` prop로 할 수 있습니다. 예를 들어,

```javascript
  render: function() {
    return <input type="text" defaultValue="Hello!" />;
  }
```

이 예제는 위에있는 **제어되지 않는 컴포넌트**에 더 가깝게 동작할 것입니다.

마찬가지로, `<input>`은 `defaultChecked`를 지원하고 `<select>`는 `defaultValue`를 지원합니다.

> 주의:
>
> `defaultValue`, `defaultChecked` prop은 최초 렌더에서만 사용됩니다. 뒤에 일어나는 렌더에서 값을 업데이트할 필요가 있다면,  [제어되는(controlled) 컴포넌트](#제어되는controlled-컴포넌트)를 사용하셔야 합니다.

## 심화 주제

### 왜 제어되는 컴포넌트인가요?

React에서 `<input>`같은 폼 컴포넌트를 사용하면, 전통적인 폼 HTML을 쓸 때에는 없던 어려운 문제가 있습니다. 예를 들어 HTML에서

```html
  <input type="text" name="title" value="Untitled" />
```

이렇게 하면 input은 `Untitled` 값으로 *초기화* 됩니다. 사용자가 input을 업데이트할 때, 노드의 `value` *프로퍼티*가 변경될 것입니다. 하지만, `node.getAttribute('value')`은 여전히 초기화 때 사용했던 값인 `Untitled`를 리턴합니다.

HTML과 다르게, React 컴포넌트는 초기화 시점 뿐만 아니라, 어떤 시점이라도 반드시 뷰의 state를 나타내야 합니다. 예를 들어 React에서

```javascript
  render: function() {
    return <input type="text" name="title" value="Untitled" />;
  }
```

이 메소드가 어떤 시점에도 뷰를 기술하기 때문에, 텍스트 input의 값은 *언제나* `Untitled`입니다.

### 왜 Textarea에 value를 사용하나요?

HTML에서, `<textarea>`의 값은 보통 그것의 자식들로 설정됩니다.

```html
  <!-- 안티패턴: 이렇게 하지 마세요! -->
  <textarea name="description">이것은 설명입니다.</textarea>
```

HTML에서는 이렇게 하면 여러 줄의 값을 쉽게 개발자가 넣을 수 있게 합니다. 하지만, React는 JavaScript기 때문에, 우리는 문자열 제한이 없고 개행이 필요하면 `\n`을 사용할 수 있습니다. 이 곳에서는 `value`와 `defaultValue`가 있고, 그것이 자식들의 역할을 모호하게 합니다. 이런 이유로, `<textarea>`의 값을 설정할 때에는 자식들을 사용하지 않아야 합니다.

```javascript
  <textarea name="description" value="이것은 설명입니다." />
```

자식들을 사용하기로 *했다면*, 자식들은 `defaultValue`처럼 동작할 것입니다.

### 왜 Select에 value를 사용하나요?

HTML `<select>`에서 선택된 `<option>`은 보통 option의 `selected` 어트리뷰트로 기술됩니다. React에서는 컴포넌트를 관리하기 쉽게 하기 위해, 다음 형식이 대신 채용됐습니다.

```javascript
  <select value="B">
    <option value="A">Apple</option>
    <option value="B">Banana</option>
    <option value="C">Cranberry</option>
  </select>
```

제어되지 않는 컴포넌트로 만드려면, 대신 `defaultValue`를 사용하세요.

> 주의:
>
> `select` 태그에 여러 옵션을 선택할 수 있도록, `value` 어트리뷰트에 배열을 넘길 수도 있습니다. `<select multiple={true} value={['B', 'C']}>`
