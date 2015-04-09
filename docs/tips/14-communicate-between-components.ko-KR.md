---
id: communicate-between-components-ko-KR
title: 컴포넌트간의 통신
layout: tips
permalink: communicate-between-components-ko-KR.html
prev: false-in-jsx-ko-KR.html
next: expose-component-functions-ko-KR.html
---

부모-자식 통신을 위해서는, 간단히 [props를 넘기면 됩니다](/react/docs/multiple-components-ko-KR.html).

자식-부모 통신을 위해서는:
`GroceryList` 컴포넌트가 배열로 생성된 아이템 목록을 가지고 있다고 해봅시다. 목록의 아이템이 클릭되면 아이템의 이름이 보이길 원할 겁니다:

```js
var GroceryList = React.createClass({
  handleClick: function(i) {
    console.log('클릭한 아이템: ' + this.props.items[i]);
  },

  render: function() {
    return (
      <div>
        {this.props.items.map(function(item, i) {
          return (
            <div onClick={this.handleClick.bind(this, i)} key={i}>{item}</div>
          );
        }, this)}
      </div>
    );
  }
});

React.render(
  <GroceryList items={['사과', '바나나', '크랜베리']} />, mountNode
);
```

`bind(this, arg1, arg2, ...)`의 사용을 확인하세요: 간단히 `handleClick`에 인자를 더 넘겼습니다. 이는 React의 새로운 컨셉이 아닙니다; 그냥 JavaScript죠.

부모-자식 관계가 없는 두 컴포넌트간의 통신을 위해, 별도로 전역(global) 이벤트 시스템을 사용할 수 있습니다. `componentDidMount()`에서 이벤트를 구독하고, `componentWillUnmount()`에서 해제합니다. 이벤트를 받으면 `setState()`를 호출합니다. [Flux](https://facebook.github.io/flux/) 패턴은 이를 정리하는 방법 중 하나입니다.
