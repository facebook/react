---
id: tooling-integration-ko-KR
title: 툴 통합
permalink: tooling-integration-ko-KR.html
prev: more-about-refs-ko-KR.html
next: addons-ko-KR.html
---

모든 프로젝트는 JavaScript를 빌드, 배포할 때 다른 시스템을 사용합니다. 우리는 가능한 한 React를 환경에 구속받지 않도록 하려 노력했습니다.

## React

### CDN-호스트 React

[다운로드 페이지](/react/downloads.html)에서 React의 CDN 호스트 버전을 제공합니다. 이 미리 빌드된 파일들은 UMD 모듈 포맷을 사용합니다. 간단한 `<script>` 태그로 넣어보면 `React` 글로벌이 환경으로 주입(inject)될 것입니다. CommonJS와 AMD환경에서 별도의 작업 없이도 동작해야 합니다.


### master 사용하기

[GitHub 저장소](https://github.com/facebook/react)의 `master`에 빌드 방법이 있습니다. 이는 `build/modules`에 CommonJS 모듈 트리를 빌드합니다. 이는 CommonJS를 지원하는 어떤 환경이나 패키징 툴에도 넣을 수 있습니다.

## JSX

### 브라우저에서 JSX 변환

JSX를 사용하신다면, Babel에서 browser.js라는 [개발용 브라우저 ES6, JSX 변환기](http://babeljs.io/docs/usage/browser/)를 제공합니다. 이는 `babel-core`의 npm 릴리스나 [CDNJS](http://cdnjs.com/libraries/babel-core)로 넣을 수 있습니다. `<script type="text/babel">`를 넣으면 JSX 변환기가 작동합니다.

> 주의:
>
> 브라우저 JSX 변환기는 꽤 크고 안 할 수도 있는 클라이언트 측 연산을 하게 됩니다. 프로덕션 환경에서 사용하지 마시고, 다음 단락을 보세요.


### 상용화하기: 미리 컴파일된 JSX

[npm](https://www.npmjs.com/) 모듈을 가지고 있다면, `npm install -g babel-cli`를 실행할 수 있습니다. Babel은 React v0.12이상을 내장 지원합니다. 태그는 자동적으로 동등한 `React.createElement(...)`로 변환되며, `displayName`은 모든 `React.createClass` 호출에 자동으로 추론, 추가됩니다.

이 툴은 JSX 구문을 일반적인 JavaScript파일로 변환해 브라우져에서 바로 실행할 수 있도록 합니다. 디렉터리를 감시해 파일이 변경되었을 때 자동으로 변환하도록 할 수도 있습니다. 예를 들면 `babel --watch src/ --out-dir lib/` 이렇게요.

Babel 6부터 기본값으로 변환기가 포함되지 않게 되었습니다. 이는 `babel` 명령을 실행할 때나 `.babelrc`에 반드시 옵션을 지정해야 한다는 뜻입니다. React를 사용할 때 가장 일반적인 방법은 `es2015`, `react` 프리셋을 사용하는 것입니다. Babel의 변경에 대한 좀 더 자세한 정보는 [블로그에 올라온 Babel 6 공지 글](http://babeljs.io/blog/2015/10/29/6.0.0/)을 읽어보세요.

ES2015 문법과 React를 사용하려 할 경우의 예제입니다.

```
npm install babel-preset-es2015 babel-preset-react
babel --presets es2015,react --watch src/ --out-dir lib/
```

기본적으로는 JSX 파일들은 `.js` 확장자로 변환됩니다. 바벨을 어떻게 사용하는지 더 자세하게 알고싶으시면 `babel --help`를 실행해 보세요.

출력 예:

```
$ cat test.jsx
var HelloMessage = React.createClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

ReactDOM.render(<HelloMessage name="John" />, mountNode);
$ babel test.jsx
"use strict";
var HelloMessage = React.createClass({
  displayName: "HelloMessage",
  render: function render() {
    return React.createElement(
      "div",
      null,
      "Hello ",
      this.props.name
    );
  }
});

ReactDOM.render(React.createElement(HelloMessage, { name: "John" }), mountNode);
```

### 도움되는 오픈소스 프로젝트들

오픈 소스 커뮤니티는 JSX와 연동하는 여러 에디터와 빌드 시스템을 만들었습니다. 전 목록은 [JSX 연동](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations)에서 보세요.
