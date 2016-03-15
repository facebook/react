---
id: jsx-overview-ko-KR
title: JSX 깊이보기
permalink: jsx-overview-ko-KR.html
next: jsx-html-differences-ko-KR.html
redirect_from:
  - tips/maximum-number-of-jsx-root-nodes-ko-KR.html
  - tips/false-in-jsx-ko-KR.html
  - docs/jsx-in-depth-ko-KR.html
---

[JSX](https://facebook.github.io/jsx/)는 XML과 비슷한 JavaScript문법 확장입니다. React에서 변환되는 간단한 JSX 구문을 사용하실 수 있습니다.

## 왜 JSX인가?

React를 위해 꼭 JSX를 사용할 필요는 없고, 그냥 일반 JS를 사용할 수도 있습니만 JSX를 사용하기를 추천합니다. 왜냐하면, 어트리뷰트를 가진 트리 구조로 정의할 수 있는 간결하고 익숙한 문법이기 때문입니다.

이것은 디자이너 같은 케쥬얼 개발자에게 더 익숙합니다.

XML에는 여닫는 태그의 장점이 있습니다. 태그는 큰 트리일 때 함수 호출이나 객체 리터럴보다 읽기 쉬워 집니다.

JSX는 JavaScript의 시맨틱을 변경하지 않습니다.

## HTML 태그 vs. React 컴포넌트

React는 렌더 HTML 태그(문자열)이나 React 컴포넌트(클래스)일 수 있습니다.

HTML 태그를 렌더하려면, 그냥 JSX에 소문자 태그를 사용하세요.

```javascript
var myDivElement = <div className="foo" />;
ReactDOM.render(myDivElement, document.getElementById('example'));
```

React 컴포넌트를 렌더하려면, 대문자로 시작하는 로컬 변수를 만드세요.

```javascript
var MyComponent = React.createClass({/*...*/});
var myElement = <MyComponent someProperty={true} />;
ReactDOM.render(myElement, document.getElementById('example'));
```

## JSX 문법

우리는 컴포넌트를 사용하는 것이 "템플릿"과 "디스플레이 로직(display logic)"을 이용하는 것보다 관심을 분리(separate concerns)하는 데에 올바른 방법이라고 강하게 믿고 있습니다. 우리는 마크업과 그것을 만들어내는 코드는 친밀하게 함께 결합되어있다고 생각합니다. 또한, 디스플레이 로직은 종종 매우 복잡하고, 그것을 템플릿 언어를 이용해 표현하는 것은 점점 사용하기 어렵게 됩니다.

우리는 이 문제를 해결하는 최고의 해결책은, UI를 만드는 진짜 프로그래밍 언어의 표현력을 모두 사용할 수 있는 JavaScript 코드로부터 HTML과 컴포넌트 트리들을 생성하는 것임을 발견했습니다.

이것을 더 쉽게 하기 위해서, 우리는 매우 간단하고, **선택적인** HTML과 비슷한 문법을 추가하여 이 React 트리 노드들을 만들 수 있게 했습니다.

**JSX는 당신으로 하여금 HTML 문법을 이용해 JavaScript 객체를 만들게 해줍니다.** React를 이용해 순수한 JavaScript 문법으로 링크를 만드려고 한다면, 코드는 다음과 같습니다:

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, '안녕하세요!')`

JSX를 이용하면:

`<a href="https://facebook.github.io/react/">안녕하세요!</a>`

우리는 이것이 React 앱들을 만들기 쉽게 하고, 디자이너들이 이 문법을 더 선호하는 것을 발견했습니다, 하지만 모든 사람은 그들만의 선호하는 워크플로우가 있기 마련이므로, **JSX는 React를 사용하기 위해 필수적이지는 않습니다.**

JSX는 매우 작은 언어입니다. 그것을 배우고 싶다면, [JSX 깊게 살펴보기](/react/docs/jsx-in-depth-ko-KR.html)를 살펴 보시기 바랍니다. 또는, [바벨 REPL](https://babeljs.io/repl/)를 통해 문법이 변환되는 것을 살펴 보시기 바랍니다.

JSX는 HTML과 비슷하지만, 완전히 똑같지는 않습니다. [JSX의 실수하기 쉬운 부분들](/react/docs/jsx-html-differences-ko-KR.html)에 중요한 차이점들에 대해 설명되어 있습니다.

[바벨에서 JSX를 시작하는 여러 방법을 제공합니다](http://babeljs.io/docs/setup/). 여기에는 커맨드 라인 툴부터 루비 온 레일스 연동까지 다양한 방법이 있습니다. 가장 편한 툴을 사용하세요.

## JSX 없이 React 사용하기

JSX는 완전히 선택적입니다. 당신은 React와 JSX를 함께 사용하지 않아도 상관없습니다. 그냥 JavaScript에서 React 엘리먼트를 `React.createElement`로 만들 수 있습니다. 여기에 태그 이름이나 컴포넌트, 속성 객체, 자식 엘리먼트들을 전달하면 됩니다.

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

편의를 위하여, 당신은 팩토리 함수 헬퍼들을 이용해 커스텀 컴포넌트로부터 엘리먼트들을 만들 수 있습니다.

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

React는 이미 일반적인 HTML 태그에 대한 빌트인 팩토리를 가지고 있습니다.

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, '텍스트')
           );
```


React JSX는 대소문자를 로컬 컴포넌트 클래스와 HTML 태그를 구별하는 컨벤션으로 사용합니다.

> 주의:
>
> JSX가 JavaScript기 때문에, `class`, `for`같은 식별자는 XML 어트리뷰트 이름으로
> 권장하지 않습니다. 대신, React DOM 컴포넌트는 각각 `className`, `htmlFor`같은
> DOM 프로퍼티 이름을 기대합니다.

<a name="the-transform"></a>
## 변환

React JSX는 XML같은 문법에서 네이티브 JavaScript로 변환됩니다. XML 엘리먼트, 어트리뷰트, 자식은 `React.createElement`에 넘겨지는 인자로 변환됩니다.

```javascript
var Nav;
// 입력 (JSX):
var app = <Nav color="blue" />;
// 출력 (JS):
var app = React.createElement(Nav, {color:"blue"});
```

`<Nav />`를 사용하려면, `Nav`변수는 스코프에 있어야 합니다.

JSX에서는 XML 구문으로 자식을 지정할 수도 있습니다.

```javascript
var Nav, Profile;
// 입력 (JSX):
var app = <Nav color="blue"><Profile>click</Profile></Nav>;
// 출력 (JS):
var app = React.createElement(
  Nav,
  {color:"blue"},
  React.createElement(Profile, null, "click")
);
```

클래스에 [displayName](/react/docs/component-specs-ko-KR.html#displayName)이 정의되어 있지 않으면 JSX는 변수명을 displayName으로 간주할 것입니다:

```javascript
// 입력 (JSX):
var Nav = React.createClass({ });
// 출력 (JS):
var Nav = React.createClass({displayName: "Nav", });
```

[바벨 REPL](https://babeljs.io/repl/)를 보면 JSX에서 어떻게 네이티브 JavaScript로 변환(desugars)하는지 볼 수 있고, [HTML-JSX 변환기](/react/html-jsx.html)는 이미 있는 HTML을 JSX로 변환해 줍니다.

JSX를 사용 하시려면, [시작하기](/react/docs/getting-started-ko-KR.html) 가이드에서 어떻게 컴파일을 하기 위해 설정하는지 보실 수 있습니다.

> 주의:
>
> JSX 표현식은 언제나 ReactElement로 변환됩니다. 실제 구현의 세부사항은 많이
> 다를 수 있습니다. 최적화 모드는 ReactElement를 `React.createElement`에서 검증
> 코드를 우회하는 객체 리터럴로 ReactElement를 인라인으로 만들 수 있습니다.

## JSX에서 False

`false` 렌더링이 여러 상황에서 어떻게 다뤄지는지 봅시다.

`id="false"`로 렌더링

```js
ReactDOM.render(<div id={false} />, mountNode);
```

문자열 `"false"`를 입력값으로

```js
ReactDOM.render(<input value={false} />, mountNode);
```

자식 없음

```js
ReactDOM.render(<div>{false}</div>, mountNode);
```

`div` 자식으로 쓰인 문자열 `"false"`를 렌더링하지 않은 것은 더 일반적인 사용 사례를 허용하기 위함입니다. `<div>{x > 1 && '하나 이상의 아이템을 가졌습니다.'}</div>`


## 네임스페이스를 사용한 컴포넌트

폼같은 자식을 많이 가지는 컴포넌트를 만든다면, 많은 변수 선언을 하게 될 것입니다.

```javascript
// 변수 선언의 어색한 블록
var Form = MyFormComponent;
var FormRow = Form.Row;
var FormLabel = Form.Label;
var FormInput = Form.Input;

var App = (
  <Form>
    <FormRow>
      <FormLabel />
      <FormInput />
    </FormRow>
  </Form>
);
```

더 간단하고 쉽게 *네임스페이스를 사용한 컴포넌트*를 사용해서, 다른 컴포넌트를 어트리뷰트로 가지는 하나의 컴포넌트만 쓸 수 있습니다.

```javascript
var Form = MyFormComponent;

var App = (
  <Form>
    <Form.Row>
      <Form.Label />
      <Form.Input />
    </Form.Row>
  </Form>
);
```

이렇게 하려면, *"sub-components"*를 메인 컴포넌트의 어트리뷰트로 만들 필요가 있습니다.

```javascript
var MyFormComponent = React.createClass({ ... });

MyFormComponent.Row = React.createClass({ ... });
MyFormComponent.Label = React.createClass({ ... });
MyFormComponent.Input = React.createClass({ ... });
```

코드를 컴파일할 때 JSX는 이것을 제대로 처리해 줍니다.

```javascript
var App = (
  React.createElement(Form, null,
    React.createElement(Form.Row, null,
      React.createElement(Form.Label, null),
      React.createElement(Form.Input, null)
    )
  )
);
```

## JavaScript 표현식

### 어트리뷰트 표현식

JavaScript 표현식을 어트리뷰트 값으로 사용하려면, 표현식을 쌍따옴표(`""`)대신 중괄호(`{}`)로 감싸야 합니다.

```javascript
// 입력 (JSX):
var person = <Person name={window.isLoggedIn ? window.name : ''} />;
// 출력 (JS):
var person = React.createElement(
  Person,
  {name: window.isLoggedIn ? window.name : ''}
);
```

### 불린 어트리뷰트

어트리뷰트의 값을 생략하면 JSX는 값을 `true`로 취급합니다. 어트리뷰트 표현식에 `false`를 넘기려면 사용해야만 합니다. HTML 폼 엘리먼트에 `disabled`, `required`, `checked`, `readOnly`같은 어트리뷰트를 사용할 일이 자주 있습니다.

```javascript
// JSX에서 이 두 줄은 똑같이 버튼을 비활성화합니다.
<input type="button" disabled />;
<input type="button" disabled={true} />;

// 그리고 JSX에서 이 두 줄은 똑같이 버튼을 비활성화하지 않습니다.
<input type="button" />;
<input type="button" disabled={false} />;
```

### 자식 표현식

비슷하게, JavaScript 표현식을 자식을 표현하는 데 사용할 수 있습니다.

```javascript
// 입력 (JSX):
var content = <Container>{window.isLoggedIn ? <Nav /> : <Login />}</Container>;
// 출력 (JS):
var content = React.createElement(
  Container,
  null,
  window.isLoggedIn ? React.createElement(Nav) : React.createElement(Login)
);
```

### 주석

JSX에 주석을 넣기는 쉽습니다. 그냥 JS 표현식과 같습니다. 그냥 태그의 자식 섹션에서만 조심하시면 됩니다. 이럴 땐 주석 주변에 `{}`를 감싸야 합니다.

```javascript
var content = (
  <Nav>
    {/* 자식 주석, {}로 감싼다 */}
    <Person
      /* 여러
         줄
         주석 */
      name={window.isLoggedIn ? window.name : ''} // 줄 끝부분 주석
    />
  </Nav>
);
```
## 루트 노드의 최대 갯수

현재 컴포넌트의 `render`는 한 노드만 리턴할 수 있습니다. 만약 `div` 배열을 리턴하려면, `div`, `span`과 같은 다른 컴포넌트로 한 번 더 싸주어야 합니다.

JSX는 일반 JS로 컴파일 함을 잊지말아야 합니다. 두개의 함수를 리턴하는 것은 문법적으로 맞지 않습니다. 이와 마찬가지로, 한 삼항 연산자 안에 한개 이상의 자식 컴포넌트를 넣으면 안됩니다.
