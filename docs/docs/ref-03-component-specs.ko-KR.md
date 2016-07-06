---
id: component-specs-ko-KR
title:  컴포넌트 명세와 생명주기
permalink: component-specs-ko-KR.html
prev: component-api-ko-KR.html
next: tags-and-attributes-ko-KR.html
---

## 컴포넌트 명세

`React.createClass()`를 호출하여 컴포넌트 클래스를 생성할 때, `render` 메소드를 포함한 명세 객체를 제공해야 합니다. 또한 필요한 경우 여기에서 설명하는 다른 생명주기 메소드를 명세 객체에 추가로 제공할 수 있습니다.

> 주의:
>
> 그냥 JavaScript 클래스를 컴포넌트 클래스로 사용할 수도 있습니다. 이 클래스는 구현할 수 있는 메소드가 거의 같지만 약간의 차이가 있습니다. 차이에 관한 더 자세한 정보는 [ES6 클래스](/react/docs/reusable-components-ko-KR.html#es6-classes)를 읽어보세요.

### render

```javascript
ReactElement render()
```

`render()` 메소드는 필수 항목입니다.

호출되면 `this.props`와 `this.state`를 토대로 하나의 자식 엘리먼트를 리턴합니다. 이 자식 엘리먼트는 네이티브 DOM 컴포넌트의 가상 표현 (`<div />`나 `React.DOM.div()` 등) 또는 직접 정의한 조합(composite) 컴포넌트가 될 수 있습니다.

아무 것도 렌더링되지 않도록 하려면 `null`이나 `false`를 리턴합니다. React는 지금의 차이 비교 알고리즘이 작동할 수 있도록 내부적으로는 `<noscript>` 태그를 렌더링합니다. `null`이나 `false`를 리턴한 경우, `ReactDOM.findDOMNode(this)`는 `null`을 리턴합니다.

`render()` 함수는 순수 함수여야 합니다. 즉, 컴포넌트의 상태를 변경하지 않고, 여러번 호출해도 같은 결과를 리턴하며, DOM을 읽고 쓰거나 브라우저와 상호작용(예를 들어 `setTimeout`를 사용)하지 않아야 합니다. 브라우저와 상호작용해야 한다면 `componentDidMount()`나 다른 생명주기 메소드에서 수행해야 합니다. `render()` 함수를 순수 함수로 유지하면 서버 렌더링이 훨씬 쓸만해지고 컴포넌트에 대해 생각하기 쉬워집니다.


### getInitialState

```javascript
object getInitialState()
```

컴포넌트가 마운트되기 전에 한번 호출됩니다. 리턴값은 `this.state`의 초기값으로 사용됩니다.


### getDefaultProps

```javascript
object getDefaultProps()
```

클래스가 생성될 때 한번 호출되고 캐시됩니다. 부모 컴포넌트에서 prop이 넘어오지 않은 경우 (`in` 연산자로 확인) 매핑의 값이 `this.props`에 설정됩니다.

이 메소드는 인스턴스가 만들어지기 전에 호출되므로 `this.props`에 의존할 수 없습니다. 그리고 `getDefaultProps()`의 리턴값에 포함된 복잡한 객체는 복사되지 않고 인스턴스 간에 공유됩니다.


### propTypes

```javascript
object propTypes
```

`propTypes` 객체는 컴포넌트에 넘어오는 props가 올바른지 검사할 수 있게 해줍니다. `propTypes`에 대한 자세한 정보는 [재사용 가능한 컴포넌트](/react/docs/reusable-components-ko-KR.html)를 참고하세요.


### mixins

```javascript
array mixins
```

`mixins` 배열은 여러 컴포넌트 사이에 동작을 공유하는 믹스인을 사용할 수 있게 해줍니다. 믹스인에 대한 자세한 정보는 [재사용 가능한 컴포넌트](/react/docs/reusable-components-ko-KR.html)를 참고하세요.


### statics

```javascript
object statics
```

`statics` 객체는 컴포넌트 클래스의 스태틱 메소드를 정의할 수 있게 해줍니다. 에를 들어:

```javascript
var MyComponent = React.createClass({
  statics: {
    customMethod: function(foo) {
      return foo === 'bar';
    }
  },
  render: function() {
  }
});

MyComponent.customMethod('bar');  // true
```

이 블럭 안에서 정의된 메소드는 인스턴스를 하나도 만들지 않은 시점에도 호출할 수 있고, 컴포넌트의 props나 state에 접근할 수 없습니다. 스태틱 메소드에서 props의 값을 확인하려면 호출자가 스태틱 메소드에 props를 인자로 넘기도록 해야합니다.


### displayName

```javascript
string displayName
```

`displayName` 문자열은 디버그 메시지에 사용됩니다. JSX는 이 값을 자동으로 설정합니다. [JSX 깊이 알기](/react/docs/jsx-in-depth-ko-KR.html#the-transform)를 참고하세요.


<a name="lifecycle-methods"></a>
## 생명주기 메소드

컴포넌트의 생명주기에서 특정 시점마다 실행되는 메소드들입니다.


### 마운트 시: componentWillMount

```javascript
void componentWillMount()
```

최초 렌더링이 일어나기 직전에 클라이언트 및 서버에서 한번 호출됩니다. 이 메소드 안에서 `setState`를 호출하면, `render()`에서 업데이트된 state를 확인할 수 있고 state가 변함에도 불구하고 `render()`가 한번만 실행됩니다.


### 마운트 시: componentDidMount

```javascript
void componentDidMount()
```

최초 렌더링이 일어난 다음 클라이언트에서만 한번 호출됩니다. (서버에서는 호출되지 않습니다.) 이 시점에 자식의 refs들에 접근 할 수 있습니다. (기본 DOM 표현에 접근하는 등). 자식 컴포넌트의 `componentDidMount()` 메소드는 부모 컴포넌트보다 먼저 호출됩니다.

다른 JavaScript 프레임워크를 연동하거나, `setTimeout`/`setInterval`로 타이머를 설정하고 AJAX 요청을 보내는 등의 작업을 이 메소드에서 합니다.


### 업데이트 시: componentWillReceiveProps

```javascript
void componentWillReceiveProps(
  object nextProps
)
```

컴포넌트가 새로운 props를 받을 때 호출됩니다. 이 메소드는 최초 렌더링 시에는 호출되지 않습니다.

`render()`가 호출되기 전에 prop의 변화를 감지하여 `this.setState()`를 호출해서 state를 업데이트할 수 있습니다. 이전 props는 `this.props`로 접근할 수 있습니다. 이 함수 안에서 `this.setState()`를 호출해도 추가 렌더링이 발생하지 않습니다.

```javascript
componentWillReceiveProps: function(nextProps) {
  this.setState({
    likesIncreasing: nextProps.likeCount > this.props.likeCount
  });
}
```

> 주의:
>
> `componentWillReceiveState`에 해당하는 메소드는 없습니다. prop이 변할 때 state가 바뀔 수는 있지만, 그 역은 불가능합니다. state의 변화에 따라 작업을 실행해야 하면 `componentWillUpdate`를 사용하세요.


<a name="updating-shouldcomponentupdate"></a>
### 업데이트 시: shouldComponentUpdate

```javascript
boolean shouldComponentUpdate(
  object nextProps, object nextState
)
```

새로운 props 또는 state를 받아 렌더링을 하기 전에 호출됩니다. 최초 렌더링 시나 `forceUpdate`를 사용하는 경우에는 호출되지 않습니다.

새로운 props와 state가 컴포넌트 업데이트를 필요로 하지 않는 것이 확실하다면
`false`를 리턴하세요.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return nextProps.id !== this.props.id;
}
```

`shouldComponentUpdate`가 false를 리턴하면, 다음에 state가 바뀌기 전까지 `render()`가 완전히 호출되지 않고 넘어갑니다. `componentWillUpdate`와 `componentDidUpdate` 또한 호출되지 않습니다.

기본적으로 `shouldComponentUpdate`는 항상 `true`를 리턴합니다. `state`가 제자리에서(in place) 바뀐 경우에 발생하는 파악하기 힘든 버그를 막기 위함입니다. 하지만 `state`가 항상 변경 불가능하도록 주의하고 `render()`에서 `props`와 `state`를 읽기만 하면 이전 props 및 state와 바뀌는 값을 비교하는 `shouldComponentUpdate`를 직접 구현할 수 있습니다.

성능에 병목이 있다면, 특히 컴포넌트가 매우 많은 경우 `shouldComponentUpdate`를 사용하여 앱을 빠르게 만들 수 있습니다.


### 업데이트 시: componentWillUpdate

```javascript
void componentWillUpdate(
  object nextProps, object nextState
)
```

새로운 props나 state를 받았을 때 렌더링 직전에 호출됩니다. 최초 렌더링 시에는 호출되지 않습니다.

업데이트가 일어나기 전에 준비하기 위해 사용할 수 있습니다.

> 주의:
>
> 이 메소드에서는 `this.setState()`를 호출할 수 없습니다. prop 변화에 반응하여 state를 업데이트해야 할 경우, `componentWillReceiveProps`를 대신 사용하세요.


### 업데이트 시: componentDidUpdate

```javascript
void componentDidUpdate(
  object prevProps, object prevState
)
```

컴포넌트의 업데이트가 DOM에 반영된 직후에 호출됩니다. 최초 렌더링 시에는 호출되지 않습니다.

컴포넌트가 업데이트된 뒤 DOM을 조작해야 하는 경우 사용할 수 있습니다.


### 마운트 해제 시: componentWillUnmount

```javascript
void componentWillUnmount()
```

컴포넌트가 DOM에서 마운트 해제 되기 직전에 호출됩니다.

이 메소드에서 타이머를 무효화하거나 `componentDidMount`에서 만들어진 DOM 엘리먼트를 정리하는 등 필요한 정리 작업을 수행할 수 있습니다.
