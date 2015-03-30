---
id: children-props-type-ko-KR
title: 자식 속성들의 타입
layout: tips
permalink: children-props-type-ko-KR.html
prev: style-props-value-px-ko-KR.html
next: controlled-input-null-value-ko-KR.html
---

컴포넌트의 자식들(`this.props.children`)은 대부분 컴포넌트의 배열로 들어갑니다:

```js
var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => true
  },

  render: function() {
    return <div />;
  }
});

React.render(
  <GenericWrapper><span/><span/><span/></GenericWrapper>,
  mountNode
);
```

하지만 자식이 하나만 있는 경우, `this.props.children`는 _배열 래퍼(wrapper)없이_ 싱글 자식 컴포넌트가 됩니다. 이렇게 함으로써 배열 할당을 줄일 수 있습니다. 

```js
var GenericWrapper = React.createClass({
  componentDidMount: function() {
    console.log(Array.isArray(this.props.children)); // => false

    // 경고 : 산출된 5 값은 'hello' 스트링의 길이 입니다. 존재하지 않는 배열 래퍼의 길이인 1이 아닙니다!

    console.log(this.props.children.length);
  },

  render: function() {
    return <div />;
  }
});

React.render(<GenericWrapper>hello</GenericWrapper>, mountNode);
```

`this.props.children`을 쉽게 다룰 수 있도록 [React.Children utilities](/react/docs/top-level-api-ko-KR.html#react.children)를 제공하고 있습니다.
