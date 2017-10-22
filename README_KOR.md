# [React](https://reactjs.org/) &middot; [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/facebook/react) [![Coverage Status](https://img.shields.io/coveralls/facebook/react/master.svg?style=flat)](https://coveralls.io/github/facebook/react?branch=master) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

React는 사용자 인터페이스 구축을 위한 JavaScript library이다.

* **선언적:** React는 대화 형 UI를 만드는 데 손쉽게 합니다.응용 프로그램의 각 상태에 대한 간단한 보기를 디자인하면 React는 데이터가 변경 될 때 올바른 구성 요소 만 효과적으로 업데이트하고 렌더링합니다. 선언적 뷰는 코드를보다 예측 가능하고 이해하기 쉽고 디버그하기 쉽도록 만듭니다.
* **구성 요소 기반 :** 자체 상태를 관리하는 캡슐화 된 구성 요소를 작성한 다음 복잡한 UI를 만들기 위해 구성합니다. 구성 요소 로직은 템플릿 대신 JavaScript로 작성되므로 앱을 통해 풍부한 데이터를 쉽게 전달하고 DOM에서 상태를 유지할 수 있습니다.
* **한번 배우고, 어디서나 쓸수 있음** 기술 스택의 나머지 부분에 대해서는 가정하지 않으므로 기존 코드를 다시 작성하지 않고 React에서 새로운 기능을 개발할 수 있습니다.
  React는 또한 Node 와 강력한 모바일 앱인 [React Native](https://facebook.github.io/react-native/)를 사용하여 서버에서 렌더링 할 수 있읍니다.

[자신의 프로젝트에서 React를 사용하는 방법 배우기](https://reactjs.org/docs/getting-started.html).

## Examples

We have several examples [on the website](https://reactjs.org/). Here is the first one to get you started:

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

This example will render "Hello John" into a container on the page.

You'll notice that we used an HTML-like syntax; [we call it JSX](https://reactjs.org/docs/introducing-jsx.html). JSX is not required to use React, but it makes code more readable, and writing it feels like writing HTML. We recommend using [Babel](https://babeljs.io/) with a [React preset](https://babeljs.io/docs/plugins/preset-react/) to convert JSX into native JavaScript for browsers to digest.

## Installation

React is available as the `react` package on [npm](https://www.npmjs.com/). It is also available on a [CDN](https://reactjs.org/docs/installation.html#using-a-cdn).

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

The recommended way to install React depends on your project. Here you can find short guides for the most common scenarios:

* [Trying Out React](https://reactjs.org/docs/installation.html#trying-out-react)
* [Creating a New Application](https://reactjs.org/docs/installation.html#creating-a-new-application)
* [Adding React to an Existing Application](https://reactjs.org/docs/installation.html#adding-react-to-an-existing-application)

## Contributing

The main purpose of this repository is to continue to evolve React core, making it faster and easier to use. Development of React happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving React.

### [Code of Conduct](https://code.facebook.com/codeofconduct)

Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://code.facebook.com/codeofconduct) so that you can understand what actions will and will not be tolerated.

### Contributing Guide

Read our [contributing guide](https://reactjs.org/contributing/how-to-contribute.html) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to React.

### Beginner Friendly Bugs

To help you get your feet wet and get you familiar with our contribution process, we have a list of [beginner friendly bugs](https://github.com/facebook/react/labels/Difficulty%3A%20beginner) that contain bugs which are fairly easy to fix. This is a great place to get started.

### License

React is [MIT licensed](./LICENSE).
