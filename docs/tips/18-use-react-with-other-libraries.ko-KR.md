---
id: use-react-with-other-libraries-ko-KR
title: React와 다른 라이브러리를 함께 사용하기
layout: tips
permalink: use-react-with-other-libraries-ko-KR.html
prev: children-undefined-ko-KR.html
next: dangerously-set-inner-html-ko-KR.html
---

React만으로 만들 필요는 없습니다. 컴포넌트의 [생명주기 이벤트](/react/docs/component-specs-ko-KR.html#lifecycle-methods), 특히 `componentDidMount`와 `componentDidUpdate`는 다른 라이브러리들의 로직을 넣기에 좋은 장소입니다.

```js
var App = React.createClass({
  getInitialState: function() {
    return {myModel: new myBackboneModel({items: [1, 2, 3]})};
  },

  componentDidMount: function() {
    $(React.findDOMNode(this.refs.placeholder)).append($('<span />'));
  },

  componentWillUnmount: function() {
    // 정리는 여기서 합니다
  },

  shouldComponentUpdate: function() {
    // 이 컴포넌트를 다시는 업데이트하지 않도록 하죠.
    return false;
  },

  render: function() {
    return <div ref="placeholder"/>;
  }
});

React.render(<App />, mountNode);
```

이 방식으로 별도의 [이벤트 리스너](/react/tips/dom-event-listeners-ko-KR.html)나 [이벤트 스트림](https://baconjs.github.io) 같은 것들을 더할 수 있습니다.
