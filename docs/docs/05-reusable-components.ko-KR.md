---
id: reusable-components-ko-KR
title: 재사용가능한 컴포넌트
permalink: reusable-components.ko-KR.html
prev: multiple-components.ko-KR.html
next: transferring-props.ko-KR.html
---

인터페이스를 설계할 때, 공통적으로 사용되는 디자인 요소들(버튼, 폼 필드, 레이아웃 컴포턴트 등)을 잘 정의된 인터페이스의 재사용가능한 컴포턴트로 분해합니다. 그런 방법으로 다음에 어떤 UI를 구축할 필요가 있을 때 훨씬 적은 코드로 만들 수 있는데, 즉 더 빠른 개발 시간, 더 적은 버그, 그리고 더 적은 용량으로 달서할 수 있다는 뜻입니다.

## Prop 검증

앱을 개발할 때 컴포넌트들이 정확히 사용되었는지 확인하는게 도움이 됩니다. 저희는 이것을 `propTypes`를 명시하는 것으로 제공합니다. `React.PropTypes`는 받은 데이터가 적절한지(valid) 확인하는데 사용할 수 있는 검증자(validator)의 범위를 제공합니다. prop에 부적절한 값을 명시한다면 JavaScript 콘솔에 경고가 보일 것입니다. 성능상의 문제로 `propTypes`는 개발중일 때만 확인하기를 권합니다. 각각의 검증자들을 명시하는지에 대한 예제가 있습니다:

```javascript
React.createClass({
  propTypes: {
    // 특정 JavaScript 프리미티브 타입에 대한 prop을 명시할 수 있습니다.
    // 기본적으로 이것들은 모두 옵셔널입니다.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,

    // 렌더링될 수 있는 모든 것: 숫자, 문자열, 요소, 그리고 이것들을 포함하는 배열
    optionalNode: React.PropTypes.node,

    // React 엘리먼트
    optionalElement: React.PropTypes.element,

    // 클래스의 인스턴스 또한 prop으로 명시할 수 있습니다. JavaScript의 instanceof 연산자를 
    // 사용합니다.
    optionalMessage: React.PropTypes.instanceOf(Message),

    // 열거형처럼 특정 값들로만 prop을 제한해서 사용할 수 있습니다.
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // 많은 타입들 중 하나로 사용할 수 있는 객체가 될 수도 있습니다.
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // 특정 타입의 배열
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // 특정 타입의 속성값을 갖는 객체
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // 특정하 형태(shape)를 취하는 객체
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // 위에 언급된 것들을 `isRequired`로 체이닝해서 prop이 제공되지 않을 때 경고를 띄우도록 할 수도
    // 있습니다.
    requiredFunc: React.PropTypes.func.isRequired,

    // 어떤 데이터 타입도 가능
    requiredAny: React.PropTypes.any.isRequired,

    // 물론 커스텀 검증자도 명시할 수 있습니다. 검증이 실패했을 때 Error 객체를 리턴해야합니다. 
    // `console.warn`을 사용하거나 throw를 사용하면 안되고 `oneOfType` 안에서는 작동하지
    // 않습니다.
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error('Validation failed!');
      }
    }
  },
  /* ... */
});
```


## 기본 Prop 값

React는 매우 선언적(declarative)인 방법으로 `props`의 기본값을 정의할 수 있게 해줍니다:

```javascript
var ComponentWithDefaultProps = React.createClass({
  getDefaultProps: function() {
    return {
      value: 'default value'
    };
  }
  /* ... */
});
```

`getDefaultProps()`의 결과값은 캐싱이 되며, 부모 컴포넌트에서 명시되지 않았을 때 `this.props.value`가 값을 가질 수 있도록해주는데 사용됩니다. 반복적이고 깨지기 쉬운 코드를 짤 필요없이 그냥 안전하게 prop을 사용하도록 해줍니다.

## Prop 전달하기: 기본

React 컴포넌트의 흔한 타입 중 하나는 단순히 기본 HTML을 확장하는 것입니다. 타이핑을 아끼기 위해 HTML 엘리먼트에 HTML 속성들을 단순히 복사하는 컴포넌트가 필요할 때가 생길 것입니다. JSX의 _spread_ 문법을 사용해 이렇게 만들 수 있습니다:

```javascript
var CheckLink = React.createClass({
  render: function() {
    // 아무 prop들을 받아서 CheckLink에 넘겨 <a>에 복사합니다.
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

React.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## Single Child

`React.PropTypes.element`을 통해 컴포넌트에 자식을 단 하나만 보내도록 명시할 수 있습니다.

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // 정확히 한 엘리먼트여야만 하며, 아니면 에러가 발생합니다.
      </div>
    );
  }

});
```

## 믹스인

컴포넌트는 React에서 코드를 재사용할 수 있는 최고의 방법이지만, 가끔 기능이 약간 겹치는 너무 다른 컴포넌트가 있을 수 있습니다. 이런 상황을 [공통된 관심사(cross-cutting concerns)](http://en.wikipedia.org/wiki/Cross-cutting_concern)라 부르며, React에서는 이 문제를 해결하기 위해 `mixins`를 제공합니다.

한가지 흔한 경우는 주기적으로 업데이트되는 컴포넌트입니다. `setInterval()`을 사용하면 쉽지만, 더이상 원치 않을 때 메모리를 아끼기 위해 주기를 취소하는 것은 중요합니다. React는 컴포넌트가 막 생성될 때 혹은 없어질 때를 [생명주기 메소드](/react/docs/working-with-the-browser.html#component-lifecycle)를 통해 알려줍니다. 이런 메소드들을 사용해서 컴포넌트가 사라질 때 자동으로 정리해주는 `setInterval()`를 제공해주는 간단한 믹스인을 만들어보겠습니다.

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // 믹스인 사용
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); 믹스인에 있는 메소드를 호출
  },
  tick: function() {
    this.setState({seconds: this.state.seconds + 1});
  },
  render: function() {
    return (
      <p>
        React has been running for {this.state.seconds} seconds.
      </p>
    );
  }
});

React.render(
  <TickTock />,
  document.getElementById('example')
);
```

믹스인의 괜찮은 점은 컴포넌트가 같은 생명주기 메소드를 사용할 때(예를 들어, 컴포넌트가 사라질 때 뭔가 정리하려는 믹스인들이 많이 있다면) 모든 생명주기 메소드들이 실행되는게 보장된다. 믹스인에 정의된 메소드들은 믹스인이 나열된 순서대로 컴포넌트의 메소드 호출 다음에 실행된다.