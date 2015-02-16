---
id: addons-ko-KR
title: 애드온
permalink: addons-ko-KR.html
prev: tooling-integration-ko-KR.html
next: animation-ko-KR.html
---

`React.addons`은 React 앱을 만드는 데 유용한 유틸리티를 두는 곳입니다. **실험적인 기능으로 취급해야 하지만** 결국 코어나 유틸리티 라이브러리에 포함될 예정입니다.

- [`TransitionGroup` 과 `CSSTransitionGroup`](animation-ko-KR.html)은 예를들면 컴포넌트 삭제 이전 처럼, 구현하기 까다로운 애니메이션과 트랜지션을 다룹니다.
- [`LinkedStateMixin`](two-way-binding-helpers-ko-KR.html)는 사용자 입력과 컴포넌트의 state사이의 조정(coordination)을 단순화 합니다.
- [`classSet`](class-name-manipulation-ko-KR.html)는 좀 더 알기 쉽게 DOM `class` 스트링을 다룹니다.
- [`cloneWithProps`](clone-with-props-ko-KR.html)는 React 컴포넌트를 얕은 복사를 하고 props를 변경합니다.
- [`update`](update-ko-KR.html)는 JavaScript안에서 불변 데이터를 다루기 쉽게하는 핼퍼 함수입니다.
- [`PureRenderMixin`](pure-render-mixin-ko-KR.html)는 특정 상황에서 성능을 향상시켜 줍니다.

밑에 있는 애드온은 React 개발 (압축되지 않은) 버전에서만 사용가능 합니다.

- [`TestUtils`](test-utils-ko-KR.html)는 테스트 케이스를 적기위한 간단한 헬퍼입니다. (압축되지않은 빌드에서만 사용가능)
- [`Perf`](perf-ko-KR.html)는 성능을 측정하고, 최적화를 위한 힌트를 제공합니다.

애드온을 쓰려면, 보통 `react.js` 대신 `react-with-addons.js`(혹은 압축판)을 사용해야 합니다.

npm을 이용해 React 패키지를 설치해 사용한다면, 그냥 `require('react')` 대신 `require('react/addons')`을 사용해 모든 에드온을 쓸 수 있습니다.
