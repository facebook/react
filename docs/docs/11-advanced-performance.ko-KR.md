---
id: advanced-performance-ko-KR
title: 성능 심화
permalink: advanced-performance-ko-KR.html
prev: perf-ko-KR.html
next: context-ko-KR.html
---

React를 도입하려 할 때 많은 사람이 묻는 첫 번째 질문은 React를 사용하지 않을 때처럼 애플리케이션이 빠르고 반응성도 좋을 것이냐는 것입니다. 모든 상태변화에 대해 컴포넌트의 하위 트리를 전부 다시 렌더링하는 아이디어에 대해 사람들은 이 프로세스가 성능에 부정적인 영향을 줄 것으로 생각하지만, React는 여러 가지 영리한 방법을 통해 UI를 업데이트하는데 필요한 비싼 DOM 조작을 최소화합니다.

## DOM 조정 회피

React는 브라우저에서 렌더된 DOM 하위 트리의 서술자 개념인 *가상의 DOM*을 사용합니다. 이 병렬적인 서술체는 React가 DOM 노드를 생성하거나 이미 존재하는 DOM 노드에 접근하는 것(JavaScript 객체를 조작하는 것보다 느리죠)을 피하게 해 줍니다. 컴포넌트의 props나 state가 변경되면 React는 새로운 가상의 DOM을 구성해 이전의 것과 비교해서 실제 DOM 업데이트가 필요한지 결정합니다. 가능한 적게 변화를 적용하기 위해, React는 둘이 다를 경우에만 DOM을 [조정](/react/docs/reconciliation-ko-KR.html)할 것입니다.

이에 더해, React는 컴포넌트 생명주기 함수인 `shouldComponentUpdate`를 제공합니다. 이는 다시 렌더링하는 프로세스(가상 DOM 비교와 어쩌면 일어날 DOM 조정)가 일어나기 직전에 일어나며 개발자가 프로세스를 중단할 수 있게 합니다. 이 함수의 기본구현은 `true`를 반환해 React가 업데이트를 수행하도록 합니다.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

React가 이 함수를 자주 호출한다는 것을 명심하십시오. 따라서 구현체는 빨라야 합니다.

대화 스레드가 여럿 돌고 있는 메시지처리 애플리케이션을 생각해 봅시다. 오직 하나의 스레드만이 변경되었다고 가정해 보죠. `ChatThread`에 `shouldComponentUpdate`를 구현했다면 React는 다른 스레드의 렌더링 프로세스를 건너뛸 수 있습니다.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: 현재의 대화 스레드가 이전의 것과 다른지 아닌지를 반환한다
}
```

정리하자면, React는 사용자가 `shouldComponentUpdate`를 사용해 렌더링 프로세스를 중단하고 가상의 DOM과 비교해 업데이트 여부를 결정해서 DOM의 하위 트리를 조정하는 비싼 DOM 조작을 피하도록 합니다.

## shouldComponentUpdate 실전

다음은 컴포넌트의 하위 트리입니다. 각각은 `shouldComponentUpdate`의 반환값(SCU)과 가상의 DOM과의 동일성(vDOMEq)을 표시합니다. 마지막으로, 원의 색은 컴포넌트가 조정되었는지를 표시합니다.

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

위의 예시에서, C2를 루트로 하는 하위 트리에 대해 `shouldComponentUpdate`가 `false`를 반환했기 때문에 React는 새로운 가상의 DOM을 만들 필요가 없습니다. 따라서 DOM을 조정할 필요도 없습니다. React가 C4와 C5에는 `shouldComponentUpdate`를 요청하지도 않은 것을 확인하세요.

C1과 C3의 `shouldComponentUpdate`가 `true`를 반환했기 때문에 React는 하위 노드로 내려가 그들을 확인합니다. C6는 `true`를 반환했네요; 이는 가상의 DOM과 같지 않기 때문에 DOM의 조정이 일어났습니다. 마지막으로 흥미로운 사례는 C8입니다. React가 이 노드를 위해 가상의 DOM을 작동했지만, 노드가 이전의 것과 일치했기 때문에 DOM의 조정을 일어나지 않았습니다.

React가 C6에만 DOM 변경을 수행한 것을 확인하세요. 이는 필연적이었습니다. C8의 경우는, 가상의 DOM과 비교를 해 제외되었고, C2의 하위 트리와 C7은 `shouldComponentUpdate` 단계에서 제외되어 가상의 DOM은 구동조차 되지 않았습니다.

자 그럼, 어떻게 `shouldComponentUpdate`를 구현해야 할까요? 문자열 값을 렌더하는 컴포넌트를 생각해보죠.

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired
  },

  render: function() {
    return <div>{this.props.value}</div>;
  }
});
```

다음과 같이 간단히 `shouldComponentUpdate`를 구현해 볼 수 있습니다:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

여기까지는 좋습니다. 간단한 props/state 구조를 다루기는 쉽습니다. 단순한 등식비교 구현을 일반화하고 이를 컴포넌트에 혼합할 수도 있습니다. 사실, React는 이미 그런 구현을 제공합니다: [PureRenderMixin](/react/docs/pure-render-mixin-ko-KR.html).

하지만 만약 컴포넌트의 props나 state가 가변적인 데이터 구조로 되어 있다면 어떨까요? 컴포넌트의 prop으로 `'bar'`같은 문자열 대신에 `{ foo: 'bar' }`처럼 문자열을 포함한 JavaScript 객체를 전달받는다고 해봅시다.

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.object.isRequired
  },

  render: function() {
    return <div>{this.props.value.foo}</div>;
  }
});
```

전에 구현했던 `shouldComponentUpdate`는 언제나 예상대로 작동하지 않을 것입니다:

```javascript
// this.props.value가 { foo: 'bar' }라고 가정합니다
// nextProps.value도 { foo: 'bar' }라고 가정하지만,
// 이 참조는 this.props.value와 다른 것입니다
this.props.value !== nextProps.value; // true
```

문제는 prop이 실제로 변경되지 않았을 때도 `shouldComponentUpdate`가 `true`를 반환할 거라는 겁니다. 이를 해결하기 위한 대안으로, 아래와 같이 구현해 볼 수 있습니다:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

기본적으로, 우리는 변경을 정확히 추적하기 위해서 깊은 비교를 해야 했습니다. 이 방법은 성능 면에서 제법 비쌉니다. 각각의 모델마다 다른 깊은 등식 코드를 작성해야 하므로 확장이 힘들어 집니다. 심지어 객체 참조를 신중히 관리하지 않는다면 작동하지도 않을 수 있습니다. 컴포넌트가 부모에 의해 다뤄지는 경우를 살펴보죠:

```javascript
React.createClass({
  getInitialState: function() {
    return { value: { foo: 'bar' } };
  },

  onClick: function() {
    var value = this.state.value;
    value.foo += 'bar'; // 안티패턴 입니다!
    this.setState({ value: value });
  },

  render: function() {
    return (
      <div>
        <InnerComponent value={this.state.value} />
        <a onClick={this.onClick}>클릭하세요</a>
      </div>
    );
  }
});
```

처음엔 내부 컴포넌트(`<InnerComponent />`)가 `{ foo: 'bar' }`를 value prop으로 가진 채 렌더될 것입니다. 사용자가 앵커(`<a>`)를 클릭한다면 부모 컴포넌트의 state는 `{ value: { foo: 'barbar' } }`로 업데이트되고, 내부 컴포넌트 또한 `{ foo: 'barbar' }`를 새로운 value prop으로 전달받아 다시 렌더링 되는 프로세스가 일어날 것입니다.

이 문제는 부모와 내부 컴포넌트가 같은 객체에 대한 참조를 공유하기 때문에 발생합니다. `onClick` 함수의 두 번째 줄에서 객체에 대한 변경이 일어날 때, 내부 컴포넌트의 prop도 변경될 것입니다. 따라서 다시 렌더링 되는 프로세스가 시작될 때 `shouldComponentUpdate`가 호출되고 `this.props.value.foo`가 `nextProps.value.foo`와 같게 됩니다. 실제로 `this.props.value`는 `nextProps.value`와 같은 객체이기 때문입니다.

그에따라 prop의 변경을 놓치게 되어 다시 렌더링하는 프로세스가 중단되고, UI는 `'bar'`에서 `'barbar'`로 업데이트되지 않습니다.

## 구원자 Immutable-js

[Immutable-js](https://github.com/facebook/immutable-js)는 Lee Byron이 만들고 Facebook이 오픈소스화 한 JavaScript 컬렉션 라이브러리입니다. 이는 *구조의 공유(structural sharing)*를 통해 *불변의 영속적인(immutable persistent)* 컬렉션을 제공합니다. 이러한 속성이 무엇을 의미하는지 살펴보죠:

* *불변성(Immutable)*: 컬렉션이 한번 생성되면, 이 후 다른 시점에 변경될 수 없습니다.
* *영속성(Persistent)*: 새로운 컬렉션이 이전의 컬렉션이나 셋(set) 같은 뮤테이션(mutation)에서 생성될 수 있습니다. 기존의 컬렉션은 새로운 컬렉션이 생성된 후에도 여전히 유효합니다.
* *구조의 공유(Structural Sharing)*: 새로운 컬렉션은 가능한 한 원래의 컬렉션과 같은 구조를 사용해 생성됩니다. 공간 효율성과 적절한 성능을 위해 복사를 최소화합니다.

불변성은 변경의 추적을 비용을 줄여줍니다; 변경은 항상 새로운 객체에만 발생하기 때문에 객체에 대한 참조가 변경될 때만 확인하면 됩니다. 예를 들어 일반적인 이 JavaScript 코드에서는:

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

`y`가 수정되더라도 여전히 같은 객체인 `x`를 참조하고 있기 때문에, 이 비교는 `true`를 반환합니다. 하지만 이 코드를 immutable-js를 사용해 다음과 같이 작성할 수 있습니다:

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar' });
var y = x.set('foo', 'baz');
x === y; // false
```

이 경우, `x`가 변경되면 새로운 참조가 반환되기 때문에, 우리는 안전하게 `x`가 변경되었을 것으로 추정할 수 있습니다.

변경을 탐지할 수 있는 또 다른 방법은 세터(setter)에 의해 설정된 플래그를 더티 체킹(dirty checking)하는 것입니다. 이 방식의 문제는 당신이 세터를 사용할 뿐만 아니라 수많은 추가 코드를 작성하거나 어떻게든 클래스들을 인스트루먼트(instrument) 하도록 강요한다는 것입니다. 혹은 변경(mutations) 직전에 객체를 깊은 복사(deep copy) 한 뒤 깊은 비교(deep compare)를 수행해 변경 여부를 판단할 수 있습니다. 이 방식의 문제점은 deepCopy와 deepCompare 둘 다 비용이 많이 드는 연산이라는 것입니다.

그래서 Immutable 자료구조는 `shouldComponentUpdate`의 구현에 필요한 객체의 변경사항을 추적할 수 있는 덜 자세하지만 저렴한 방법을 제공합니다. 그에 따라 immutable-js가 제공하는 추상화를 사용해 props와 state 어트리뷰트를 모델링한다면, `PureRenderMixin`을 사용해 성능을 향상할 수 있습니다.

## Immutable-js와 Flux

[Flux](https://facebook.github.io/flux/)를 사용한다면 immutable-js를 사용해 stores를 작성해야 합니다. [전체 API](https://facebook.github.io/immutable-js/docs/#/)를 살펴보세요.

Immutable 자료구조를 이용해 스레드를 모델링하는 예제를 살펴봅시다. 먼저 모델링하려는 엔티티마다 `Record`를 정의해야 합니다. Record는 특정 필드들의 값을 유지하기 위한 불변의 컨테이너입니다:

```javascript
var User = Immutable.Record({
  id: undefined,
  name: undefined,
  email: undefined
});

var Message = Immutable.Record({
  timestamp: new Date(),
  sender: undefined,
  text: ''
});
```

`Record` 함수는 필드별로 기본값이 선언된 객체에 대한 정의를 넘겨받습니다.

메시지 store는 두 개의 List를 통해 users와 messages를 추적할 수 있습니다:

```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

각각의 *페이로드* 타입을 처리하는 기능을 구현하는 것은 꽤 간단합니다. 예를 들면, store가 새 메시지를 나타내는 페이로드를 확인할 때 레코드를 새로 생성하고 메시지 리스트에 추가할 수 있습니다.

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

자료구조가 불변이기 때문에 push 함수의 결과를 `this.messages`에 할당할 필요가 있으니 주의하세요.

React 측에서는, 컴포넌트의 state를 보존하기 위해 immutable-js 자료구조를 사용한다면, 모든 컴포넌트에 `PureRenderMixin`을 혼합해 다시 렌더링하는 프로세스를 중단할 수 있습니다.
