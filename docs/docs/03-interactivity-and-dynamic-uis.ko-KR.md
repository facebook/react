---
id: interactivity-and-dynamic-uis-ko-KR
title: 상호 작용 및 동적 UI
permalink: docs/interactivity-and-dynamic-uis-ko-KR.html
prev: jsx-gotchas-ko-KR.html
next: multiple-components-ko-KR.html
---

이미 React에서 [어떻게 데이터를 표시](/react/docs/displaying-data-ko-KR.html)하는지를 배웠습니다. 이제 UI와의 상호작용을 어떻게 만드는지 살펴보죠.

## 간단한 예제

```javascript
var LikeButton = React.createClass({
  getInitialState: function() {
    return {liked: false};
  },
  handleClick: function(event) {
    this.setState({liked: !this.state.liked});
  },
  render: function() {
    var text = this.state.liked ? 'liked' : 'haven\'t liked';
    return (
      <p onClick={this.handleClick}>
        You {text} this. Click to toggle.
      </p>
    );
  }
});

ReactDOM.render(
  <LikeButton />,
  document.getElementById('example')
);
```

## 이벤트 핸들링과 통합적인(Synthetic) 이벤트

React에서의 이벤트 핸들러는 HTML에서 그러던 것처럼 간단히 카멜케이스 프로퍼티(camelCased prop)로 넘기면 됩니다. React의 모든 이벤트는 통합적인 이벤트 시스템의 구현으로 IE8 이상에서는 같은 행동이 보장됩니다. 즉, React는 사양에 따라 어떻게 이벤트를 일으키고(bubble) 잡는지 알고 있고, 당신이 사용하는 브라우저와 관계없이 이벤트 핸들러에 전달되는 이벤트는 [W3C 사양](http://www.w3.org/TR/DOM-Level-3-Events/)과 같도록 보장됩니다.

## 기본 구현: 오토바인딩과 이벤트 델리게이션
<a name="under-the-hood-autobinding-and-event-delegation"></a>

코드를 고성능으로 유지하고 이해하기 쉽게 하기 위해, React는 보이지 않는 곳에서 몇 가지 일을 수행합니다.

**오토바인딩:** JavaScript에서 콜백을 만들 때, 보통은 `this`의 값이 정확하도록 명시적으로 메소드를 인스턴스에 바인드해야 합니다. React에서는 모든 메소드가 자동으로 React의 컴포넌트 인스턴스에 바인드됩니다.(ES6 클래스 문법을 사용할 때는 재외하고) React가 바인드 메소드를 캐시하기 때문에 매우 CPU와 메모리에 효율적입니다. 타이핑해야 할 것도 줄어들죠!

**이벤트 델리게이션:** React는 실제로는 노드자신에게 이벤트 핸들러를 붙이지 않습니다. React가 시작되면 React는 탑 레벨의 단일 이벤트 리스너로 모든 이벤트를 리스닝하기 시작합니다. 컴포넌트가 마운트되거나 언마운트 될 때, 이벤트 핸들러는 그냥 내부 매핑에서 넣거나 뺄 뿐입니다. 이벤트가 발생하면, React는 이 매핑을 사용해서 어떻게 디스패치할 지를 알게 됩니다. 매핑에 이벤트 핸들러가 남아있지 않으면, React의 이벤트 핸들러는 그냥 아무것도 하지 않습니다. 왜 이 방식이 빠른지 더 알고 싶으시면, [David Walsh의 멋진 블로그 글](http://davidwalsh.name/event-delegate)을 읽어 보세요.

## 컴포넌트는 그냥 state 머신일 뿐

React는 UI를 간단한 state 머신이라 생각합니다. UI를 다양한 state와 그 state의 렌더링으로 생각함으로써 UI를 일관성 있게 관리하기 쉬워집니다.

React에서는, 간단히 컴포넌트의 state를 업데이트하고, 이 새로운 state의 UI를 렌더링합니다. React는 DOM의 변경을 가장 효율적인 방법으로 관리해줍니다.

## state의 동작 원리

React에게 데이터의 변경을 알리는 일반적인 방법은 `setState(data, callback)`을 호출하는 것입니다. 이 메소드는 `this.state`에 `data`를 머지하고 컴포넌트를 다시 렌더링 합니다. 컴포넌트의 재-렌더링이 끝나면, 생략가능한 `callback`이 호출됩니다. 대부분의 경우 React가 UI를 최신상태로 유지해주기 때문에 `callback`을 사용할 필요가 없습니다.

## 어떤 컴포넌트가 state를 가져야 할까요?

대부분의 컴포넌트는 `props`로부터 데이터를 받아 렌더할 뿐입니다만, 가끔 유저 인풋, 서버 요청, 시간의 경과에 반응해야 할 필요가 있습니다. 이럴 때 state를 사용합니다.

**가능한 한 컴포넌트가 상태를 가지지 않도록(stateless) 하세요.** 이렇게 함으로써 가장 논리적인 장소로 state를 격리하게 되고 쉽게 애플리케이션을 추론할 수 있도록 중복을 최소화할 수 있습니다.

일반적인 패턴은 데이터만 렌더하는 여러 상태를 가지지 않은 컴포넌트를 만들고, 그 위에 상태기반(stateful) 컴포넌트를 만들어 계층 안의 자식 컴포넌트에게 `props`를 통해 state를 전달하는 것입니다. state를 가지지 않은 컴포넌트가 선언적인 방법으로 데이터를 렌더링 하는 동안, 상태기반 컴포넌트는 모든 상호작용 로직을 캡슐화합니다.

## state를 어떻게 *써야* 할까요?

**state는 컴포넌트의 이벤트 핸들러에 의해 UI 업데이트를 트리거할때 변경될 가능성이 있어, 그때 사용할 데이터를 가져야 합니다.** 실제 앱에서는 이 데이터는 매우 작고 JSON 직렬화 가능한 경향이 있습니다. 상태기반 컴포넌트를 만들때, 가능한 작게 state를 서술하고 `this.state`에만 저장하도록 해보세요. 그냥 `render()` 안에서 이 state를 기반으로 다른 모든 정보를 계산합니다. 이 방식으로 애플리케이션을 작성하고 생각하면 가장 최적의 애플리케이션으로 발전해가는 경향이 있다는 것을 발견하게 될 것입니다. 꼭 필요하지 않은 값이나 계산된 값을 state에 추가하는 것은 render가 그것을 계산하는 대신에 명시적으로 그것들을 맞춰줘야 하는 것을 의미하기 때문이죠.

## state를 어떻게 *쓰지 말아야* 할까요?

`this.state`는 UI의 state를 표현할 최소한의 데이터만을 가져야 합니다. 그래서 이런 것들을 가지지 않게끔 해야 합니다.

* **계산된 데이터:** state에 따라 값을 미리 계산하는 것에 대해 염려하지 마세요. 계산은 모두 `render()`에서 하는 것이 UI의 일관성을 유지하기 쉽습니다. 예를 들어, state에서 list items 배열을 가지고 있고 문자열으로 카운트를 렌더링 할 경우, state에 저장하기보다는 그냥 `render()` 메소드안에서 `this.state.listItems.length + ' list items'`를 렌더하세요.
* **React 컴포넌트:** 가지고 있는 props와 state로 `render()`안에서 만드세요.
* **props에서 복사한 데이터:** 가능한 한 원래의 소스로 props를 사용하도록 해보세요. props를 state에 저장하는 단 하나의 올바른 사용법은 이전 값을 알고 싶을 때입니다. props는 부모 컴포넌트의 재 렌더링의 결과 변경될 수도 있기 때문이죠.
