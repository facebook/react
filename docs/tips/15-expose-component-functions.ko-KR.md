---
id: expose-component-functions-ko-KR
title: 컴포넌트 함수 드러내기
layout: tips
permalink: expose-component-functions-ko-KR.html
prev: communicate-between-components-ko-KR.html
next: references-to-components-ko-KR.html
---

[컴포넌트간의 통신](/react/tips/communicate-between-components-ko-KR.html)을 위한 (일반적이지 않은) 또다른 방법이 있습니다: 단순히 부모의 호출을 위해 자식 컴포넌트의 메소드를 노출하는 겁니다. 

할일 목록을 생각해보죠. 아이템을 클릭하면 제거되고, 하나가 남으면 애니메이션 효과를 줍니다:

```js
var Todo = React.createClass({
  render: function() {
    return <div onClick={this.props.onClick}>{this.props.title}</div>;
  },

  //이 컴포넌트는 `ref` 어트리뷰트를 통해 부모에게 다뤄질 것입니다
  animate: function() {
    console.log('%s이 애니메이팅하는것처럼 속입니다', this.props.title);
  }
});

var Todos = React.createClass({
  getInitialState: function() {
    return {items: ['사과', '바나나', '크랜베리']};
  },

  handleClick: function(index) {
    var items = this.state.items.filter(function(item, i) {
      return index !== i;
    });
    this.setState({items: items}, function() {
      if (items.length === 1) {
        this.refs.item0.animate();
      }
    }.bind(this));
  },

  render: function() {
    return (
      <div>
        {this.state.items.map(function(item, i) {
          var boundClick = this.handleClick.bind(this, i);
          return (
            <Todo onClick={boundClick} key={i} title={item} ref={'item' + i} />
          );
        }, this)}
      </div>
    );
  }
});

React.render(<Todos />, mountNode);
```

다른 방법으로는, `isLastUnfinishedItem` prop을 `todo`에 넘기는 방식으로 원하는 바를 이룰수도 있습니다. `componentDidUpdate`에서 prop을 확인하고 스스로 애니메이션 효과를 주는겁니다; 하지만 애니메이션 제어를 위해 다른 prop들을 넘기게 되면 이는 금새 난잡해질 수 있습니다.
