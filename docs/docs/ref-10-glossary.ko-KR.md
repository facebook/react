---
id: glossary-ko-KR
title: React (가상) DOM 용어
permalink: docs/glossary-ko-KR.html
prev: webcomponents-ko-KR.html
---

다음은 React에서 사용되는 용어들로, 이 다섯 가지의 타입을 구별하는 것은 중요합니다.

- [ReactElement / ReactElement 팩토리](#react-엘리먼트)
- [ReactNode](#react-노드)
- [ReactComponent / ReactComponent 클래스](#react-컴포넌트)

## React 엘리먼트

`ReactElement`는 React의 주요 타입입니다. `type`, `props`, `key`, `ref`의 네 가지 프로퍼티를 가집니다. 메소드는 가지지 않으며 프로토타입에는 아무 것도 들어있지 않습니다.

이러한 객체는 `React.createElement`를 통해 만들 수 있습니다.

```javascript
var root = React.createElement('div');
```

DOM에 새로운 트리를 렌더링하기 위해서는 `ReactElement`를 만들고 일반적인 DOM `Element` (`HTMLElement` 또는 `SVGElement`)와 함께 `ReactDOM.render`에 넘깁니다. `ReactElement`를 DOM `Element`와 혼동해서는 안됩니다. `ReactElement`는 가볍고, 상태를 갖지 않으며, 변경 불가능한, DOM `Element`의 가상 표현입니다. 즉 가상 DOM입니다.

```javascript
ReactDOM.render(root, document.getElementById('example'));
```

DOM 엘리먼트에 프로퍼티를 추가하려면 두번째 인자로 프로퍼티 객체를, 세번째 인자로 자식을 넘깁니다.

```javascript
var child = React.createElement('li', null, 'Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child);
ReactDOM.render(root, document.getElementById('example'));
```

React JSX를 사용하면 `ReactElement`가 알아서 만들어집니다. 따라서 다음 코드는 앞의 코드와 같습니다:

```javascript
var root = <ul className="my-list">
             <li>Text Content</li>
           </ul>;
ReactDOM.render(root, document.getElementById('example'));
```

### 팩토리

`ReactElement` 팩토리는 그저 특정한 `type` 프로퍼티를 가지는 `ReactElement`를 만들어주는 함수입니다. React에는 팩토리를 만드는 헬퍼가 내장되어 있습니다. 그 함수는 사실상 다음과 같습니다:

```javascript
function createFactory(type) {
  return React.createElement.bind(null, type);
}
```

이를 이용하면 편리한 단축 함수를 만들 수 있어 항상 `React.createElement('div')`를 입력하지 않아도 됩니다.

```javascript
var div = React.createFactory('div');
var root = div({ className: 'my-div' });
ReactDOM.render(root, document.getElementById('example'));
```

React에는 이미 보통의 HTML 태그를 위한 팩토리가 내장되어 있습니다:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```

JSX를 사용하면 팩토리가 필요하지 않습니다. 이미 JSX가 `ReactElement`를 만드는 편리한 단축 문법을 제공합니다.


## React 노드

`ReactNode`는 다음 중 하나가 될 수 있습니다:

- `ReactElement`
- `string` (`ReactText`로 부르기도 함)
- `number` (`ReactText`로 부르기도 함)
- `ReactNode`의 배열 (`ReactFragment`로 부르기도 함)

이들은 자식을 표현하기 위해 다른 `ReactElement`의 프로퍼티에 사용됩니다. 사실상 이들이 `ReactElement`의 트리를 형성합니다.


## React 컴포넌트

`ReactElement`만 가지고도 React를 사용할 수는 있지만, React의 장점을 제대로 활용하려면 `ReactComponent`를 사용하여 상태를 가진 캡슐화된 객체를 만들기를 원할 것입니다.

`ReactComponent` 클래스는 그냥 JavaScript 클래스 (또는 "생성자 함수")입니다.

```javascript
var MyComponent = React.createClass({
  render: function() {
    ...
  }
});
```

이 생성자가 호출될 때 최소한 `render` 메소드를 가진 객체를 리턴해야 합니다. 이 리턴된 객체를 `ReactComponent`라고 부릅니다.

```javascript
var component = new MyComponent(props); // 절대 하지 마세요.
```

테스트 목적이 아니라면 *절대* 이 생성자를 직접 호출하지 마십시오. React가 알아서 호출해줍니다.

대신 `ReactComponent` 클래스를 `createElement`에 넘겨 `ReactElement`를 받을 수 있습니다.

```javascript
var element = React.createElement(MyComponent);
```

또는 JSX를 사용하면:

```javascript
var element = <MyComponent />;
```

이것이 `ReactDOM.render`에 넘겨지면 React가 알아서 생성자를 호출하여 `ReactComponent`를 만들고 리턴합니다.

```javascript
var component = ReactDOM.render(element, document.getElementById('example'));
```

같은 타입의 `ReactElement`와 같은 컨테이너 DOM `Element`를 가지고 `ReactDOM.render`를 계속 호출하면 항상 같은 인스턴스를 리턴합니다. 이 인스턴스는 상태를 가집니다.

```javascript
var componentA = ReactDOM.render(<MyComponent />, document.getElementById('example'));
var componentB = ReactDOM.render(<MyComponent />, document.getElementById('example'));
componentA === componentB; // true
```

그렇기 때문에 직접 인스턴스를 만들어서는 안됩니다. `ReactComponent`가 생성되기 전에 `ReactElement`가 대신 가상의 `ReactComponent` 역할을 합니다. 이전 `ReactElement`와 새 `ReactElement`를 비교하여 새로운 `ReactComponent`를 만들지, 아니면 기존 것을 재사용할지 결정합니다.

`ReactComponent`의 `render` 메소드는 또다른 `ReactElement`를 리턴해야 합니다. 이렇게 해서 컴포넌트들이 조합됩니다. 결과적으로 렌더링 과정은 다음과 같습니다. `string` 타입의 태그를 가진 `ReactElement`를 통해 DOM `Element` 인스턴스가 생성되며 문서에 삽입됩니다.


## 형식 타입 정의

### 진입점

```
ReactDOM.render = (ReactElement, HTMLElement | SVGElement) => ReactComponent;
```

### 노드와 엘리먼트

```
type ReactNode = ReactElement | ReactFragment | ReactText;

type ReactElement = ReactComponentElement | ReactDOMElement;

type ReactDOMElement = {
  type : string,
  props : {
    children : ReactNodeList,
    className : string,
    etc.
  },
  key : string | boolean | number | null,
  ref : string | null
};

type ReactComponentElement<TProps> = {
  type : ReactClass<TProps>,
  props : TProps,
  key : string | boolean | number | null,
  ref : string | null
};

type ReactFragment = Array<ReactNode | ReactEmpty>;

type ReactNodeList = ReactNode | ReactEmpty;

type ReactText = string | number;

type ReactEmpty = null | undefined | boolean;
```

### 클래스와 컴포넌트

```
type ReactClass<TProps> = (TProps) => ReactComponent<TProps>;

type ReactComponent<TProps> = {
  props : TProps,
  render : () => ReactElement
};
```

