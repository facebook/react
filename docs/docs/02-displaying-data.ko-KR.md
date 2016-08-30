---
id: displaying-data-ko-KR
title: 데이터를 표시하기
permalink: docs/displaying-data-ko-KR.html
prev: why-react-ko-KR.html
next: jsx-in-depth-ko-KR.html
---

UI를 가지고 할 수 있는 가장 기초적인 것은 데이터를 표시하는 것입니다. React는 데이터를 표시하고 데이터가 변할 때마다 인터페이스를 최신의 상태로 자동으로 유지하기 쉽게 해 줍니다.

## 시작하기

정말 간단한 예제를 보도록 하죠. 다음과 같은 코드의 `hello-react.html` 파일을 만듭시다.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** 코드는 여기에 작성하면 됩니다! **

    </script>
  </body>
</html>
```

문서의 나머지에서, 코드가 위와 같은 HTML 템플릿에 들어갔다고 가정하고 JavaScript 코드에만 집중할 것입니다. 위의 주석 부분을 다음과 같은 JSX 코드로 바꿔 보세요:

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        안녕, <input type="text" placeholder="이름을 여기에 작성하세요" />!
        지금 시간은 {this.props.date.toTimeString()} 입니다.
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## 반응 적(Reactive) 업데이트

`hello-react.html` 파일을 웹 브라우저에서 열어 당신의 이름을 텍스트 필드에 써 보세요. React는 단지 시간을 표시하는 부분만을 바꿉니다 — 텍스트 필드 안에 입력한 것은 그대로 남아 있구요, 당신이 이 동작을 관리하는 그 어떤 코드도 쓰지 않았음에도 불구하고 말이죠. React는 그걸 올바른 방법으로 알아서 해줍니다.

우리가 이걸 할 수 있었던 건, React는 필요한 경우에만 DOM을 조작하기 때문입니다. **React는 빠른 React 내부의 DOM 모형을 이용하여 변경된 부분을 측정하고, 가장 효율적인 DOM 조작 방법을 계산해 줍니다.**

이 컴포넌트에 대한 입력은 `props` 라고 불립니다 — "properties" 를 줄인 것이죠. 그들은 JSX 문법에서는 어트리뷰트로서 전달됩니다. 당신은 `props` 를 컴포넌트 안에서 불변의(immutable) 엘리먼트로서 생각해야 하고, `this.props` 를 덮어씌우려고 해서는 안됩니다.

## 컴포넌트들은 함수와 같습니다

React 컴포넌트들은 매우 단순합니다. 당신은 그것들을 `props` 와 `state` (이것들은 나중에 언급할 것입니다) 를 받고 HTML을 렌더링하는 단순한 함수들로 생각해도 됩니다. 이걸 염두하면, 컴포넌트의 작동을 이해하는 것도 쉽습니다.

> 주의:
>
> **한가지 제약이 있습니다**: React 컴포넌트들은 단 하나의 루트 노드(root node)만을 렌더할 수 있습니다. 만약 여러개의 노드들을 리턴하고 싶다면, 그것들은 단 하나의 루트 노드로 싸여져 있어야만 합니다.

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

JSX는 HTML과 비슷하지만, 완전히 똑같지는 않습니다. [JSX의 실수하기 쉬운 부분들](/react/docs/jsx-gotchas-ko-KR.html)에 중요한 차이점들에 대해 설명되어 있습니다.

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
