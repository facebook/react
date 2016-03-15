---
id: displaying-data-ko-KR
title: 데이터를 표시하기
permalink: displaying-data-ko-KR.html
prev: why-react-ko-KR.html
next: interactivity-and-dynamic-uis-ko-KR.html
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
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://fb.me/react-dom-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
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
