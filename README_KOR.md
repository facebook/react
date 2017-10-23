# [React](https://reactjs.org/) &middot; [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/facebook/react) [![Coverage Status](https://img.shields.io/coveralls/facebook/react/master.svg?style=flat)](https://coveralls.io/github/facebook/react?branch=master) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

React는 사용자 인터페이스 구축을 위한 JavaScript library입니다.

* **선언적:** React는 대화 형 UI를 만드는 데 손쉽게 합니다.응용 프로그램의 각 상태에 대한 간단한 보기를 디자인하면 React는 데이터가 변경 될 때 올바른 구성 요소 만 효과적으로 업데이트하고 렌더링합니다. 선언적 뷰는 코드를보다 예측 가능하고 이해하기 쉽고 디버그하기 쉽도록 만듭니다.
* **구성 요소 기반 :** 자체 상태를 관리하는 캡슐화 된 구성 요소를 작성한 다음 복잡한 UI를 만들기 위해 구성합니다. 구성 요소 로직은 템플릿 대신 JavaScript로 작성되므로 앱을 통해 풍부한 데이터를 쉽게 전달하고 DOM에서 상태를 유지할 수 있습니다.
* **한번 배우고, 어디서나 쓸수 있음** 기술 스택의 나머지 부분에 대해서는 가정하지 않으므로 기존 코드를 다시 작성하지 않고 React에서 새로운 기능을 개발할 수 있습니다.
  React는 또한 Node 와 강력한 모바일 앱인 [React Native](https://facebook.github.io/react-native/)를 사용하여 서버에서 렌더링 할 수 있읍니다.

[자신의 프로젝트에서 React를 사용하는 방법 배우기](https://reactjs.org/docs/getting-started.html).

## Examples

우리는 [웹 사이트에](https://reactjs.org/) 몇가지 예를 가지고 있읍니다. 시작하기 위한 한가지의 예는 다음과 같습니다.:

```jsx
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

ReactDOM.render(
  <HelloMessage name="John" />,
  document.getElementById('container')
);
```

이 예제는 페이지의 컨테이너안에 "Hello John"을 렌더링할 것입니다.

우리는 [JSX](https://reactjs.org/docs/introducing-jsx.html)라고 불리우는 HTML과 비슷한 문법을 가진 구문을 사용한 것을 눈치 챌 수 있읍니다. JSX는 React를 사용할 필요가 없지만 코드를 더 읽기 쉽게 만들어 HTML 작성과 같은 느낌을줍니다. [Babel](https://babeljs.io/)을 [React preset](https://babeljs.io/docs/plugins/preset-react/)과 함께 사용하여 JSX를 브라우저가 소화할 수 있는 기본 JavaScript로 변환하는 것이 좋습니다.

## 설치하기

React는 [npm](https://www.npmjs.com/)에 `react` 패키지로 제공됩니다. [CDN](https://reactjs.org/docs/installation.html#using-a-cdn)에서도 구할 수 있습니다.

React는 유연하며 다양한 프로젝트에서 사용할 수 있습니다. 새로운 앱을 만들 수는 있지만 다시 작성하지 않고 점진적으로 기존 codebase에 도입 할 수도 있습니다.

React를 설치하는 권장 방법은 프로젝트에 따라 다릅니다. 다음은 가장 일반적인 시나리오에 대한 간단한 가이드입니다.:

* [React를 시도해보기](https://reactjs.org/docs/installation.html#trying-out-react)
* [새로운 어플리케이션을 만들기](https://reactjs.org/docs/installation.html#creating-a-new-application)
* [기존 어플리케이션에 React 추가하기](https://reactjs.org/docs/installation.html#adding-react-to-an-existing-application)

## 기여하기

이 저장소의 주요 목적은 React 코어를 계속 발전시켜 더 빠르고 쉽게 사용할 수있게하는 것입니다.  React의 개발은 GitHub에서 열리 며, 버그 수정 및 개선에 기여한 커뮤니티에 감사드립니다. React를 향상시키는 데 어떻게 참여할 수 있는지 배우려면 아래를 읽으십시오.

### [행동 강령](https://code.facebook.com/codeofconduct)

Facebook은 프로젝트 참여자가 준수해야 할 행동 강령을 채택했습니다. 어떤 행동이 용인 될 것인지, 용인되지 않을 것인지 이해할 수 있도록 [행동 강령 전문](https://code.facebook.com/codeofconduct)을 읽으십시오.

### 기여 안내

개발 프로세스, 버그 수정 및 개선 제안 방법, React에 대한 변경 사항을 빌드하고 테스트하는 방법에 대해 알아 보려면 [기여 안내](https://reactjs.org/contributing/how-to-contribute.html)를 읽어보십시오.


### 초보자 친화적 인 버그

버그 때문에 식은 땀을 흘리는 초보자들과 기여 프로세스에 익숙해 지도록하는 것을 돕기위해 버그 수정이 쉬운 [초보자용 버그목록](https://github.com/facebook/react/labels/Difficulty%3A%20beginner)이 있습니다.이것은 React를 시작하기에 훌륭한 곳입니다.


### 라이센스

React는 [MIT licensed](./LICENSE)를 따릅니다.
