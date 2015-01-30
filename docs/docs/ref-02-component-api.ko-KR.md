---
id: component-api-ko-KR
title: 컴포넌트 API
permalink: component-api.ko-KR.html
prev: top-level-api.ko-KR.html
next: component-specs.ko-KR.html
---

## ReactComponent

React 컴포넌트의 인스턴스는 React가 렌더링 시에 내부적으로 만듭니다. 이때 만들어진 인스턴스는 이후의 렌더링에서 다시 사용되고 컴포넌트의 메소드들에서 `this` 변수로 접근할 수 있습니다. React 외부에서 React 컴포넌트의 핸들을 얻는 방법은 `React.render`의 리턴값을 저장하는 것이 유일합니다. 다른 컴포넌트 안에서 비슷한 결과를 얻으려면 [refs](/react/docs/more-about-refs.ko-KR.html)를 사용해야 합니다.


### setState

```javascript
setState(object nextState[, function callback])
```

`nextState`를 현재 state에 합칩니다. 이벤트 핸들러와 서버 요청 콜백에서 UI 업데이트를 발생시키기 위해 이 메소드를 주로 사용합니다. 콜백 함수를 추가로 넘기면 `setState`가 완료되고 컴포넌트가 다시 렌더링된 다음에 한번 호출됩니다.

> 주의:
>
> *절대로* `this.state`를 직접 변경하지 마세요. 그 뒤에 `setState()`를 호출하면 그동안 변경했던 것이 교체될 수 있습니다. `this.state`는 변경 불가능한 것으로 생각하시는 것이 좋습니다.
>
> `setState()`를 호출해도 `this.state`가 곧바로 변경되지 않고 대기 중인 state transition이 만들어집니다. 이 메소드를 호출한 직후 `this.state`에 접근하면 바뀌기 전의 값을 리턴할 가능성이 있습니다.
>
> `setState`에 대한 호출이 동기적으로 처리된다는 보장이 없으며, 성능 향상을 위해 배치 처리될 수 있습니다.
>
> `setState()`는 `shouldComponentUpdate()`에 조건부 렌더링 로직이 구현되어 있지 않다면 항상 재렌더링을 발생시킵니다. 변경 가능한 객체를 사용하고 있고 조건부 렌더링 로직을 `shouldComponentUpdate()`에 구현할 수 없는 경우라면 새로운 state가 이전 state와 달라지는 경우에만 `setState()`를 호출하여 불필요한 재렌더링을 피할 수 있습니다.


### replaceState

```javascript
replaceState(object nextState[, function callback])
```

`setState()`와 비슷하지만 기존에 존재하는 state 중 nextState에 없는 키는 모두 삭제됩니다.


### forceUpdate()

```javascript
forceUpdate([function callback])
```

`render()` 메소드가 `this.props`나 `this.state`가 아닌 다른 곳에서 데이터를 읽어오는 경우 `forceUpdate()`를 호출하여 React가 `render()`를 다시 실행하도록 만들 수 있습니다. `this.state`를 직접 변경하는 경우에도 `forceUpdate()`를 호출해야 합니다.

`forceUpdate()`를 호출하면 해당 컴포넌트와 그 자식들의 `render()` 함수가 호출되지만, React는 마크업이 변경된 경우에만 DOM을 업데이트합니다.

특별한 경우가 아니면 `forceUpdate()`는 되도록 피하시고 `render()`에서는 `this.props`와 `this.state`에서만 읽어오세요. 그렇게 하는 것이 애플리케이션을 훨씬 단순하고 효율적으로 만들어줍니다.


### getDOMNode

```javascript
DOMElement getDOMNode()
```

이 컴포넌트가 DOM에 마운트된 경우 해당하는 네이티브 브라우저 DOM 요소를 리턴합니다. 이 메소드는 폼 필드의 값이나 DOM의 크기/위치 등 DOM에서 정보를 읽을 때 유용합니다. `render`가 `null`이나 `false`를 리턴하였다면 `this.getDOMNode()`는 `null`을 리턴합니다.


### isMounted()

```javascript
bool isMounted()
```

`isMounted()`는 컴포넌트가 DOM에 렌더링되었으면 true를, 아니면 false를 리턴합니다. 비동기적으로 `setState()`나 `forceUpdate()`를 호출할 때 이 메소드를 사용하여 오류를 방지할 수 있습니다.


### setProps

```javascript
setProps(object nextProps[, function callback])
```

외부 JavaScript 애플리케이션과 연동하는 경우 `React.render()`로 렌더링된 React 컴포넌트에 변경을 알리고 싶을 때가 있습니다.

최상위 컴포넌트를 업데이트할 때 `React.render()`를 같은 노드에 다시 호출하는 것이 바람직한 방법이지만, `setProps()`를 호출해서 props를 바꾸고 재렌더링을 발생시킬 수 있습니다. 콜백 함수를 추가로 넘기면 `setProps`가 완료되고 컴포넌트가 다시 렌더링된 다음에 한번 호출됩니다.

> 주의:
>
> 가능하다면 `React.render()`를 다시 호출하는 선언적인 방법이 더 바람직합니다. 그렇게 하는 편이 업데이트에 대해 생각하는 것을 쉽게 만듭니다. (두가지 방식에 눈에 띄는 성능 차이는 없습니다.)
>
> 이 메소드는 최상위 컴포넌트에만 호출 가능합니다. 다시 말해, `React.render()`에 바로 넘긴 컴포넌트에서만 사용할 수 있고 자식에서는 불가능합니다. 자식 컴포넌트에 `setProps()`를 사용하고 싶다면, 그 대신 반응적인 업데이트의 장점을 활용하여 `render()` 안에서 자식 컴포넌트를 만들 때 새로운 prop을 넘기세요.


### replaceProps

```javascript
replaceProps(object nextProps[, function callback])
```

`setProps()`와 비슷하지만 두 객체를 합치는 대신 이전에 존재하던 props를 삭제합니다.
