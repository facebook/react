---
id: getting-started-ko-KR
title: 시작해보기
permalink: getting-started-ko-KR.html
next: tutorial-ko-KR.html
redirect_from: "docs/index-ko-KR.html"
---

## JSFiddle

React를 시작하는 가장 빠른 방법은 다음의 Hello World JSFiddle 예제를 따라 해 보는 것입니다.

 * **[React JSFiddle](https://jsfiddle.net/reactjs/69z2wepo/)**
 * [React JSFiddle without JSX](https://jsfiddle.net/reactjs/5vjqabv3/)

## 초심자용 키트

초심자용 키트를 내려받아 시작합니다.

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    초심자용 키트 내려받기 {{site.react_version}}
  </a>
</div>

초심자용 키트의 최상위 디렉터리에 아래의 내용대로 `helloworld.html` 파일을 생성합니다.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <script src="build/JSXTransformer.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">
      React.render(
        <h1>Hello, world!</h1>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```

JavaScript 안에 보이는 XML 구문은 JSX라고 합니다; 더 자세한 내용은 [JSX syntax](/react/docs/jsx-in-depth-ko-KR.html)을 확인하세요. 일반적인 JavaScript로 번역하기 위해 `<script type="text/jsx">`를 사용하고 `JSXTransformer.js`를 포함하는 것으로 실제로 브라우저에서 변환작업을 수행합니다.

### 파일의 분리

React JSX 코드는 분리된 파일로 존재할 수 있습니다. 다음 내용으로 `src/helloworld.js`를 생성해보세요.

```javascript
React.render(
  <h1>Hello, world!</h1>,
  document.getElementById('example')
);
```

그다음 `helloworld.html`에서 참조합니다:

```html{10}
<script type="text/jsx" src="src/helloworld.js"></script>
```

### 오프라인 변환

먼저 커맨드라인 도구를 설치합니다. ([npm](https://www.npmjs.com/) 필요):

```
npm install -g react-tools
```

그다음, `src/helloworld.js` 파일을 일반 JavaScript 파일로 변환합니다:

```
jsx --watch src/ build/
```

수정할 때마다 `build/helloworld.js` 파일이 자동생성됩니다.

```javascript{2}
React.render(
  React.createElement('h1', null, 'Hello, world!'),
  document.getElementById('example')
);
```

아래의 내용대로 HTML 파일을 업데이트합니다:

```html{6,10}
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <!-- JSXTransformer는 이제 불필요합니다! -->
  </head>
  <body>
    <div id="example"></div>
    <script src="build/helloworld.js"></script>
  </body>
</html>
```

## CommonJS를 원하시나요?

만약 React를 [browserify](http://browserify.org/), [webpack](https://webpack.github.io/)이나 기타 CommonJS와 호환되는 모듈시스템과 함께 사용하고 싶다면, [`react` npm 패키지](https://www.npmjs.com/package/react)를 사용하세요. 그 외에도 `jsx` 빌드툴은 아주 쉽게 CommonJS 외에도 대부분의 패키징 시스템에 통합될 수 있습니다.

## 다음 단계로

더 알아보려면 [튜토리얼](/react/docs/tutorial-ko-KR.html)과 초심자용 키트의 `examples` 디렉터리에서 다른 예제들을 확인해 보세요.

커뮤니티의 기여로 운영되는 Wiki도 있습니다: [워크플로우, UI 컴포넌트, 라우팅, 데이터 관리 등](https://github.com/facebook/react/wiki/Complementary-Tools)

React의 세계에 오신 것을 환영합니다. 행운을 빌어요!
