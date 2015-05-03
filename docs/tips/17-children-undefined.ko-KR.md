---
id: children-undefined-ko-KR
title: 정의되지 않은 this.props.children
layout: tips
permalink: children-undefined-ko-KR.html
prev: references-to-components-ko-KR.html
next: use-react-with-other-libraries-ko-KR.html
---

`this.props.children`을 통해 자식 컴포넌트에 접근할 수 없습니다. `this.props.children`은 소유자에 의해 자식이 **전달**되도록 지정합니다:

```js
var App = React.createClass({
  componentDidMount: function() {
    // 이는 `span`을 참조하지 않습니다! 
    // 마지막 줄의 `<App></App>` 사이의 정의되지 않은 자식을 참조합니다.
    console.log(this.props.children);
  },

  render: function() {
    return <div><span/><span/></div>;
  }
});

React.render(<App></App>, mountNode);
```

서브 컴포넌트(`span`)에 억세스하려면, [refs](/react/docs/more-about-refs.html)를 넣으세요.
