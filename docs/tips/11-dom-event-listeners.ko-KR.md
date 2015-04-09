---
id: dom-event-listeners-ko-KR
title: 컴포넌트에서 DOM 이벤트 리스너
layout: tips
permalink: dom-event-listeners-ko-KR.html
prev: props-in-getInitialState-as-anti-pattern-ko-KR.html
next: initial-ajax-ko-KR.html
---

> 주의:
>
> 이 글은 React에서 제공되지 않은 DOM 이벤트를 어떻게 붙이는지 설명합니다. ([더 자세한 정보는 여기에서 보세요.](/react/docs/events-ko-KR.html)). 이는 jQuery 같은 다른 라이브러리들을 통합할 때 좋습니다.

윈도우 크기를 조절해봅시다.

```js
var Box = React.createClass({
  getInitialState: function() {
    return {windowWidth: window.innerWidth};
  },

  handleResize: function(e) {
    this.setState({windowWidth: window.innerWidth});
  },

  componentDidMount: function() {
    window.addEventListener('resize', this.handleResize);
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },

  render: function() {
    return <div>Current window width: {this.state.windowWidth}</div>;
  }
});

React.render(<Box />, mountNode);
```

컴포넌트가 마운트 되고 DOM 표현을 가지게 되면 `componentDidMount`가 호출됩니다. 일반적인 DOM 이벤트를 붙이는 곳으로 여기를 종종 사용합니다.

이벤트 콜백은 원래 엘리먼트 대신 React 컴포넌트에 바인드하는 걸 주의합시다. React는 [오토바인드](/react/docs/interactivity-and-dynamic-uis-ko-KR.html#under-the-hood-autobinding-and-event-delegation) 과정에서 메서드를 현재 컴포넌트 인스턴스로 바인드합니다.

