---
id: component-api-ko-KR
title: 컴포넌트 API
permalink: docs/component-api-ko-KR.html
prev: top-level-api-ko-KR.html
next: component-specs-ko-KR.html
---

## React.Component

React 컴포넌트의 인스턴스는 React가 렌더링 시에 내부적으로 만듭니다. 이때 만들어진 인스턴스는 이후의 렌더링에서 다시 사용되고 컴포넌트의 메소드들에서 `this` 변수로 접근할 수 있습니다. React 외부에서 React 컴포넌트의 핸들을 얻는 방법은 `ReactDOM.render`의 리턴값을 저장하는 것이 유일합니다. 다른 컴포넌트 안에서 비슷한 결과를 얻으려면 [refs](/react/docs/more-about-refs-ko-KR.html)를 사용해야 합니다.


### setState

```javascript
void setState(
  function|object nextState,
  [function callback]
)
```

nextState를 현재 state에 얕게(shallow) 병합합니다. 이벤트 핸들러와 서버 요청 콜백에서 UI 업데이트를 발생시키기 위해 이 메소드를 주로 사용합니다.

첫번째 인자는 업데이트를 위한 키를 0개 이상 가진 객체이거나 업데이트를 위한 키들을 포함한 객체를 반환하는 함수(의 state나 props)일 수 있습니다.

객체를 사용하는 간단한 예제입니다:

```javascript
setState({mykey: '새로운 값'});
```

`function(state, props)`처럼 인자를 포함한 함수를 넘겨주는 것도 가능합니다. 어떤 값이든 state와 props의 이전 값을 참고해서 원자적인 업데이트를 큐에 추가(enqueue)하려는 경우 이는 유용합니다. 예를 들어 state의 값을 증가 시키려는 경우 같이 처리 가능합니다:

```javascript
setState(function(previousState, currentProps) {
  return {myInteger: previousState.myInteger + 1};
});
```

두번째 인자는 선택적이며, `setState`가 한번 완료되고 컴포넌트가 다시 렌더 되었을때 실행되는 콜백 함수입니다.

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
void replaceState(
  object nextState,
  [function callback]
)
```

`setState()`와 비슷하지만 기존에 존재하는 state 중 nextState에 없는 키는 모두 삭제됩니다.

> 주의:
>
> 이 메소드는 `React.Component`를 확장한 ES6 `class` 컴포넌트에서는 사용할 수 없습니다. React의 미래 버전에서 이는 완전히 사라지게 될 것입니다.


### forceUpdate

```javascript
void forceUpdate(
  [function callback]
 )
```

기본적으로, 컴포넌트의 state나 props가 변경되면, 컴포넌트는 다시 렌더됩니다. 하지만 이런 변경이 묵시적이거나(예를들어 객체의 변경 없이 깊이 있는 데이터만 변경된 경우) `render()` 함수가 다른 값에 의존하는 경우, `forceUpdate()`를 호출해 React에게 `render()`를 다시 실행할 필요가 있다고 알릴 수 있습니다.

`forceUpdate()`를 호출하면 `shouldComponentUpdate()`를 생략하고 해당 컴포넌트 `render()` 함수가 호출됩니다. 각 자식 컴포넌트에 대해서는 `shouldComponentUpdate()`를 포함해 보통 라이프 사이클 메서드를 호출합니다. React는 마크업이 변경된 경우에만 DOM을 업데이트합니다.

특별한 경우가 아니면 `forceUpdate()`는 되도록 피하시고 `render()`에서는 `this.props`와 `this.state`에서만 읽어오세요. 그렇게 하는 것이 컴포넌트를 "순수"하게 하고 애플리케이션을 훨씬 단순하고 효율적으로 만들어줍니다.


### isMounted

```javascript
boolean isMounted()
```

`isMounted()`는 컴포넌트가 DOM에 렌더링되었으면 `true`를, 아니면 `false`를 리턴합니다. 비동기적으로 `setState()`나 `forceUpdate()`를 호출할 때 이 메소드를 사용하여 오류를 방지할 수 있습니다.

> 주의:
>
> 이 메소드는 `React.Component`를 확장한 ES6 `class` 컴포넌트에서는 사용할 수 없습니다. React의 미래 버전에서 이는 완전히 사라지게 될 것입니다.
