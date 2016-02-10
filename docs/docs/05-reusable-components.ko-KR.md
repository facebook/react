---
id: reusable-components-ko-KR
title: 재사용가능한 컴포넌트
permalink: reusable-components-ko-KR.html
prev: multiple-components-ko-KR.html
next: transferring-props-ko-KR.html
---

인터페이스를 설계할 때, 공통적으로 사용되는 디자인 요소들(버튼, 폼 필드, 레이아웃 컴포넌트 등.)을 잘 정의된 인터페이스의 재사용 가능한 컴포넌트로 분해합니다. 이런 방법으로 다음에 UI를 구축할 때에는 훨씬 적은 코드로 만들 수 있습니다. 이 말은 더 빠른 개발 시간, 더 적은 버그, 더 적은 용량으로 할 수 있다는 뜻이죠.

## Prop 검증

앱의 규모가 커지면 컴포넌트들이 바르게 사용되었는지 확인하는게 도움이 됩니다. 확인은 `propTypes`를 명시해서 할 수 있습니다. `React.PropTypes`는 받은 데이터가 적절한지(valid) 확인하는데 사용할 수 있는 다양한 검증자(validator)를 제공합니다. prop에 부적절한 값을 명시한다면 JavaScript 콘솔에 경고가 보일 것입니다. 성능상의 문제로 `propTypes`는 개발 모드에서만 검사됩니다. 다음은 제공되는 검증자를 설명하는 예제입니다.

```javascript
React.createClass({
  propTypes: {
    // 특정 JavaScript 프리미티브 타입에 대한 prop을 명시할 수 있습니다.
    // 기본적으로 이것들은 모두 선택적입니다.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,

    // 렌더링될 수 있는 모든 것: 숫자, 문자열, 요소
    // 이것들을 포함하는 배열(이나 프래그먼트)
    optionalNode: React.PropTypes.node,

    // React 엘리먼트
    optionalElement: React.PropTypes.element,

    // 클래스의 인스턴스 또한 prop으로 명시할 수 있습니다. JavaScript의 instanceof
    // 연산자를 사용합니다.
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

    // 특정한 형태(shape)의 객체
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // 위에 언급된 것들을 `isRequired`로 연결해서 prop이 제공되지 않을 때 경고를
    // 띄우도록 할 수도 있습니다.
    requiredFunc: React.PropTypes.func.isRequired,

    // 어떤 데이터 타입도 가능
    requiredAny: React.PropTypes.any.isRequired,

    // 물론 사용자 정의 검증자도 지정할 수 있습니다. 이는 검증이 실패했을 때
    // Error 객체를 리턴해야합니다. `console.warn`을 이나 throw를 하면 안됩니다.
    // 그렇게하면 `oneOfType` 안에서 작동하지 않습니다.
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

React는 매우 선언적(declarative)인 방법으로 `props`의 기본값을 정의할 수 있게 해줍니다.

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

`getDefaultProps()`의 결과값은 캐시가 되며, 부모 컴포넌트에서 명시되지 않았을 때 `this.props.value`가 값을 가질 수 있도록 해주는데 사용됩니다.`getDefaultProps()`를 사용하면 반복적이고 깨지기 쉬운 코드를 짤 필요없이 그냥 안전하게 prop을 사용할 수 있습니다.

## Prop 전달하기: 단축

React 컴포넌트의 흔히 그냥 기본 HTML 엘리먼트를 확장해서 씁니다. 타이핑을 아끼기 위해 기저의 HTML 엘리먼트에 HTML 속성들을 단순히 복사하는 컴포넌트가 필요할 수도 있습니다. JSX의 _spread_ 문법을 사용하면 이렇게 할 수 있습니다.

```javascript
var CheckLink = React.createClass({
  render: function() {
    // 모든 prop을 받아서 CheckLink에 넘기고 <a>에 복사합니다.
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

ReactDOM.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## 단일 자식

`React.PropTypes.element`을 통해 컴포넌트에 한 자식만 보내도록 명시할 수 있습니다.

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

컴포넌트는 React에서 코드를 재사용할 수 있는 최고의 방법이지만, 가끔 아주 다른 컴포넌트에서 공통 기능이 필요한 때도 있습니다. 이런 상황을 [공통된 관심사(cross-cutting concerns)](https://en.wikipedia.org/wiki/Cross-cutting_concern)라 부르며, React에서는 `mixins`으로 이 문제를 해결합니다.

예를 들어, 컴포넌트가 주기적으로 업데이트되길 원할 경우가 있습니다. `setInterval()`을 사용하면 쉽지만, 필요 없어지면 메모리를 아끼기 위해 주기를 꼭 취소해야 합니다. React는 컴포넌트가 막 생성거나 없어질 때를 [생명주기 메소드](/react/docs/working-with-the-browser-ko-KR.html#component-lifecycle)를 통해 알려줍니다. 이런 메소드들을 사용해서 컴포넌트가 사라질 때 자동으로 정리해주는 `setInterval()`를 제공해주는 간단한 믹스인을 만들어보겠습니다.

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.forEach(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // 믹스인 사용
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // 믹스인에 있는 메소드를 호출
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

ReactDOM.render(
  <TickTock />,
  document.getElementById('example')
);
```

믹스인의 괜찮은 점은 컴포넌트가 여러 믹스인을 사용하고 여러 믹스인에서 같은 생명주기 메소드를 사용할 때(예를 들어, 여러 믹스인에서 컴포넌트가 사라질 때 뭔가 정리하려 한다면) 모든 생명주기 메소드들의 실행은 보장됩니다. 믹스인에 정의된 메소드은 컴포넌트의 메소드가 호출됨에 따라 믹스인이 나열된 순서대로 실행됩니다.

<a name="es6-classes"></a>
## ES6 클래스

React 클래스를 일반적인 JavaScript 클래스로 선언할 수도 있습니다. 다음의 예제는 ES6 클래스 문법을 사용합니다:

```javascript
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

API는 `getInitialState`를 제외하고 `React.createClass`와 유사합니다. 별도의 `getInitialState` 메소드 대신에, 필요한 `state` 프로퍼티를 생성자에서 설정할 수 있습니다.

또다른 차이점은 `propTypes`와 `defaultProps`가 클래스의 내부가 아니라 생성자의 프로퍼티로 정의되어 있다는 것입니다.

```javascript
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
  }
  tick() {
    this.setState({count: this.state.count + 1});
  }
  render() {
    return (
      <div onClick={this.tick.bind(this)}>
        Clicks: {this.state.count}
      </div>
    );
  }
}
Counter.propTypes = { initialCount: React.PropTypes.number };
Counter.defaultProps = { initialCount: 0 };
```

### 자동 바인딩 안됨

메소드는 일반 ES6 클래스와 동일한 시멘틱을 따릅니다. `this`를 인스턴스에 자동으로 바인딩하지 않는다는 이야기입니다. 명시적으로 `.bind(this)`나 [화살표 함수(arrow function)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) `=>`를 사용하세요.

### 믹스인 안됨

불행하게도 ES6는 믹스인에 대한 지원이 없이 출시되었기 때문에, React에서 ES6 클래스를 사용한다면 믹스인을 사용할 방법이 없습니다. 대신, 우리는 믹스인에 의존하지 않고도 동작하도록 만들기 위해 열심히 노력하고 있습니다.

<a name="stateless-functions"></a>
## 상태를 가지지 않는 함수

React 클래스를 일반 JavaScript 함수로 작성할 수도 있습니다. 상태를 가지지 않는 함수 문법을 사용하는 예제입니다.

```javascript
function HelloMessage(props) {
  return <div>Hello {props.name}</div>;
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

아니면 ES6의 화살표 문법을 사용할 수 있습니다.

```javascript
const HelloMessage = (props) => <div>Hello {props.name}</div>;
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

이 단순화된 컴포넌트 API는 prop의 순수 함수인 컴포넌트를 나타냅니다. 이 컴포넌트는 내부 상태가 없어야 하고, 내부 인스턴스가 없어야 하고, 컴포넌트 생명주기 메소드가 없어야 합니다. 아무런 준비 과정없이 입력에 대한 순수한 기능적 변환이어야 합니다.

> 주의:
>
> 상태를 가지지 않는 함수는 내부 인스턴스가 없기 때문에, ref를 상태를 가지지않는 함수에 넣을 수 없습니다. 상태를 가지지 않는 함수는 명령형(imperative) API를 제공하지 않기 때문에 일반적으로 이것은 문제가 되지 않습니다. 명령형 API없이 인스턴스에 할 수 있는 것이 많지 않기도 하죠. 하지만 상태를 가지지 않는 컴포넌트의 DOM 노드를 검색하길 원한다면, 반드시 상태 기반 컴포넌트(예. ES6 클래스 컴포넌트)로 컴포넌트를 감싸고 상태 기반 래퍼 컴포넌트에 ref를 붙여야 합니다.

이상적으로는, 대부분의 컴포넌트는 상태를 가지지 않는 함수여야 합니다. 왜냐 하면 이런 상태를 가지지 않는 컴포넌트는 React 코어 안에서 더 빠른 코드 경로를 거치기 때문입니다. 이는 가능한 한 추천하는 패턴입니다.
