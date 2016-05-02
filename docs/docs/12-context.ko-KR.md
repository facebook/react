---
id: context
title: 컨텍스트
permalink: docs/context-ko-KR.html
prev: advanced-performance-ko-KR.html
---

React의 가장 큰 장점 중 하나는 React 컴포넌트를 통해 데이터의 흐름을 추적하기 쉽다는 것입니다. 컴포넌트를 보면 각각의 프로퍼티가 어떻게 전달되었는지 쉽게 파악할 수 있습니다. 

때때로 컴포넌트 트리를 통해 props을 전단하는 대신 수동으로 모든 레벨에서 데이터를 전달하고 싶은 경우가 있습니다. React의 "컨텍스트" 기능은 이를 가능하게 해줍니다.


> 주의:
>
> 컨텍스트는 실험적인 고급 기능입니다. 향후 릴리즈에서 API가 변경될 수 있습니다.
>
> 대부분은 애플리켄이션은 컨텍스트가 필요하지 않을겁니다. 특히 React로 시작한 경우에는 컨텍스트를 사용하지 않을겁니다. 컨텍스트의 사용은 데이터 흐름을 명확하지 않게 만들기 때문에 코드를 이해하기 어려워 집니다. 이는 마치 앱에서 전역 변수를 state로 전달하는 경우와 유사합니다.
>
> **만약 컨텍스트를 사용해야 하는 경우에도, 가능한 아껴 사용하세요.**
>
> 구축하는것이 애플리케이션이든 라이브러리든간에, 가능한 컨텍스트의 사용은 작은 영역으로 격리하고 직접적으로 컨텍스트 API를 사용하는 것을 피하세요. 그렇게 하면 API가 변경 되더라도 쉽게 업데이트 할 수 있습니다. 

## 트리를 통해 정보를 자동으로 전달하기

아래와 같은 구조가 있다고 가정해 봅시다:

```javascript
var Button = React.createClass({
  render: function() {
    return (
      <button style={{'{{'}}background: this.props.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button color={this.props.color}>삭제</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  render: function() {
    var color = "purple";
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} color={color} />;
    });
    return <div>{children}</div>;
  }
});
```

이 예제에서, 우리는 스타일을 주기 위해 수동으로 적절하게 `Button`과 `Messages` 컴포넌트에 `color` 프로퍼티를 엮어서 전달했습니다. 테마는 서브트리가 정보 조각의 일부(여기선 color)에 접근하기 원하는 좋은 예제입니다. 컨텍스트를 사용하면 우리는 이를 자동으로 트리로 전달할 수 있습니다:

```javascript{2-4,7,18,25-30,33}
var Button = React.createClass({
  contextTypes: {
    color: React.PropTypes.string
  },
  render: function() {
    return (
      <button style={{'{{'}}background: this.context.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  childContextTypes: {
    color: React.PropTypes.string
  },
  getChildContext: function() {
    return {color: "purple"};
  },
  render: function() {
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} />;
    });
    return <div>{children}</div>;
  }
});
```

`childContextTypes`와 `getChildContext`를 `MessageList`(context provider)에 추가함으로써, React는 정보를 자동으로 아래로 전달하며 서브트리내의 어떤 컴포넌트든 (여기선 `Button`) `contextTypes`를 정의함으로써 이에 접근할 수 있습니다.

`contextTypes`가 정의되지 않은 경우, `this.context`는 빈 오브젝트가 됩니다.

## 부모-자식 커플링

컨텍스트는 다음과 같은 API를 구성할 수 있게 해줍니다:

```javascript
<Menu>
  <MenuItem>가지</MenuItem>
  <MenuItem>땅콩호박</MenuItem>
  <MenuItem>클레멘타인</MenuItem>
</Menu>
```

`Menu` 컴포넌트에서 관련 정보를 전달함으로써 각각의 `MenuItem`가 부모인 `Menu` 컴포넌트와 통신할 수 있습니다.

**이 API를 이용해 컴포넌트를 구성하기 전에, 깔끔한 대안이 있는지 먼저 고려해 보세요.** 다음과 같이 간단히 아이템을 배열로 넘겨 보겠습니다:

```javascript
<Menu items={['가지', '땅콩호박', '클레멘타인']} />
```

원한다면 전체 React 컴포넌트를 프로퍼티로 전달할 수도 있습니다. 

## Referencing context in lifecycle methods

If `contextTypes` is defined within a component, the following lifecycle methods will receive an additional parameter, the `context` object:

```javascript
void componentWillReceiveProps(
  object nextProps, object nextContext
)

boolean shouldComponentUpdate(
  object nextProps, object nextState, object nextContext
)

void componentWillUpdate(
  object nextProps, object nextState, object nextContext
)

void componentDidUpdate(
  object prevProps, object prevState, object prevContext
)
```

## Referencing context in stateless functional components

Stateless functional components are also able to reference `context` if `contextTypes` is defined as a property of the function. The following code shows the `Button` component above written as a stateless functional component.

```javascript
function Button(props, context) {
  return (
    <button style={{'{{'}}background: context.color}}>
      {props.children}
    </button>
  );
}
Button.contextTypes = {color: React.PropTypes.string};
```

## 컨텍스트를 사용하지 말아야 하는 경우

대부분의 경우, 깔끔한 코드를 위해 전역 변수를 피하는 것과 마찬가지로 컨텍스트의 사용을 피해야 합니다. 특히 "타이핑을 줄이거나" 명시적인 프로퍼티 전달 대신 이를 사용하려는 경우 다시 한번 생각해 보세요.

컨텍스트의 가장 적절한 사용 사례는 로그인한 유저, 언어 설정, 테마 정보 등을 암시적으로 전달하는 것입니다. 컨텍스트를 사용함으로써 이런 정보들을 전역으로 다루는 대신 단일 React 서브트리 내에서 다룰 수 있습니다. 

모델 데이터를 컴포넌트로 전달하는데 컨텍스트를 사용하지 마세요. 트리를 통해 명시적으로 데이터를 엮어 전달하는 것이 훨씬 이해하기 쉽습니다. 컨텍스트는 렌더되는 위치에 따라 다르게 작동하기 때문에 컴포넌트를 더욱 연결되고(coupled) 재사용성이 떨어지게 만듭니다. 

## 알려진 한계점

컴포넌트에 의해 제공되는 컨텍스트의 값이 변경될 때, 중간 부모가 `shouldComponentUpdate`에서`false`을 반환한다면 그 값을 사용하는 자손은 업데이트되지 않습니다. 자세한 내용은 [#2517](https://github.com/facebook/react/issues/2517) 이슈를 확인하세요.
