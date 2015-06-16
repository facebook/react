---
id: props-in-getInitialState-as-anti-pattern-ko-KR
title: getInitialState의 Props는 안티패턴
layout: tips
permalink: props-in-getInitialState-as-anti-pattern-ko-KR.html
prev: componentWillReceiveProps-not-triggered-after-mounting-ko-KR.html
next: dom-event-listeners-ko-KR.html
---

> 주의 : 
>
> 이것은 React에만 국한된 팁이 아니고 안티패턴은 평범한 코드 속 에서도 종종 발생합니다. 이 글에서는 React로 간단하게 설명해 보겠습니다.

부모로부터 받은 props를 이용하여 `getInitialState`에서 state를 생성할 때 종종 "진실의 소스", 예를 들어 진짜 데이터가 있는 곳을 중복으로 만들 때가 있습니다. 가능하던 안하던, 나중에 싱크되지 않는 확실한 값을 계산하고 또한 유지보수에도 문제를 야기합니다.

**나쁜 예제:**

```js
var MessageBox = React.createClass({
  getInitialState: function() {
    return {nameWithQualifier: 'Mr. ' + this.props.name};
  },

  render: function() {
    return <div>{this.state.nameWithQualifier}</div>;
  }
});

React.render(<MessageBox name="Rogers"/>, mountNode);
```

더 나은 코드:

```js
var MessageBox = React.createClass({
  render: function() {
    return <div>{'Mr. ' + this.props.name}</div>;
  }
});

React.render(<MessageBox name="Rogers"/>, mountNode);
```

(복잡한 로직이라, 메소드에서 계산하는 부분만 떼어 왔습니다.)

하지만 여기서 싱크를 맞출 목적이 아님을 명확히 할 수 있다면, 이것은 안티 패턴이 **아닙니다.**



```js
var Counter = React.createClass({
  getInitialState: function() {
    // initial로 시작하는 메소드는 내부에서 받은 어떠한 값을 초기화 할 목적이 있다는 것을 나타냅니다.
    return {count: this.props.initialCount};
  },

  handleClick: function() {
    this.setState({count: this.state.count + 1});
  },

  render: function() {
    return <div onClick={this.handleClick}>{this.state.count}</div>;
  }
});

React.render(<Counter initialCount={7}/>, mountNode);
```
