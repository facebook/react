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

JSX를 사용하신다면, [다운로드 페이지](/react/downloads.html)에서 브라우저 JSX 변환기를 제공합니다. 간단히 `<script type="text/jsx">`를 인클루드하면 JSX 변환기가 작동합니다.

> 주의:
>
> 브라우저 JSX 변환기는 꽤 크고 안 할 수도 있는 클라이언트 측 연산을 하게 됩니다. 프로덕션에서 사용하지 마시고, 다음 단락을 보세요.


### 상용화하기: 미리 컴파일된 JSX

[npm](http://npmjs.org/) 모듈을 가지고 있다면, 간단히 `npm install -g react-tools`를 실행해 커맨드 라인 `jsx` 툴을 설치할 수 있습니다. 이 툴은 JSX 구문을 일반적인 JavaScript파일로 변환해 브라우져에서 바로 실행할 수 있도록 합니다. 디렉터리를 감시해 파일이 변경되었을 때 자동으로 변환하도록 할 수도 있습니다. 예를 들면 `jsx --watch src/ build/` 이렇게요.

기본적으로는 JSX 파일들은 `.js` 확장자로 변환됩니다. `jsx --extension jsx src/ build/`를 사용해 `.jsx` 확장자로 파일들을 변환할 수 있습니다.

이 툴을 어떻게 사용하는지 더 자세하게 알고싶으시면 `jsx --help`를 실행해 보세요.


### 도움되는 오픈소스 프로젝트들

오픈 소스 커뮤니티는 JSX와 연동하는 여러 에디터와 빌드 시스템을 만들었습니다. 전 목록은 [JSX 연동](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations)에서 보세요.
