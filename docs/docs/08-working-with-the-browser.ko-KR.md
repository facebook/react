---
id: working-with-the-browser-ko-KR
title: 브라우저에서의 동작
permalink: working-with-the-browser-ko-KR.html
prev: forms-ko-KR.html
next: more-about-refs-ko-KR.html
---

React는 대부분의 경우 직접 DOM을 다루지 않아도 될만큼 강력한 추상화를 제공합니다. 하지만 서드파티 라이브러리나 기존의 코드들을 다루다 보면 간혹 기저(underlying)의 API에 접근해야 할 때도 있습니다.


## 가상의 DOM

React는 DOM을 직접 다루지 않기 때문에 매우 빠릅니다. React는 메모리에(in-memory) DOM의 표상(representation)을 관리합니다. `render()` 메소드는 사실은 DOM의 *서술*를 반환하고, React는 이를 메모리에 있는 DOM의 표상과 비교해 가장 빠른 방식으로 계산해서 브라우저를 업데이트해 줍니다.

게다가 React는 브라우저의 괴악함(quirks)에도 불구하고 모든 이벤트 객체가 W3C 명세를 보장하도록 통합적인 이벤트 시스템을 구현했습니다. 모든 것이 일관된 방식으로 일어나고(bubbles) 효율적으로 크로스 브라우징을 수행합니다. 심지어 IE8에서도 HTML5 이벤트를 사용할 수 있습니다!

더 효율적이고 쉬우므로 대개의 경우 React의 "가짜 브라우저"를 이용해 작업을 하게 될 것입니다. 하지만 간혹 jQuery 플러그인 같은 서드파티 라이브러리를 다루다 보면 기저(underlying)의 API에 접근할 필요가 있을지도 모릅니다. React는 기저의 DOM API를 직접 다루는 회피방법을 제공합니다.


## Refs와 findDOMNode()

브라우저와 상호 작용하려면 DOM 노드에 대한 참조가 필요합니다. `ref`를 어떤 엘리먼트에도 붙일 수 있으며, 이를 통해 컴포넌트 **지원 인스턴스**를 참조 할 수 있습니다. 이는 컴포넌트에 필수 적인 기능을 호출할 때나 기저의 DOM 노드에 접근하고 싶을 때 유용합니다. [refs에서 컴포넌트로](/react/docs/more-about-refs-ko-KR.html) 문서에서 refs를 효율적으로 사용하는 법을 포함해 더 많은 내용을 익혀보세요.


<a name="component-lifecycle"></a>
## 컴포넌트 생명주기

컴포넌트의 생명주기에는 세 가지 주요 부분이 있습니다:

* **Mounting:** 컴포넌트가 DOM에 삽입되고 있습니다.
* **Updating:** 컴포넌트가 DOM의 업데이트 여부를 결정하기 위해 다시 렌더링되고 있습니다.
* **Unmounting:** 컴포넌트가 DOM에서 제거되고 있습니다.

React는 이 프로세스에 훅을 지정할 수 있는 생명주기 메소드를 제공합니다. 발생 직전 시점을 위한 **will** 메소드, 발생 직후 시점을 위한 **did** 메소드가 있습니다.

### Mounting

* `getInitialState(): object`는 컴포넌트가 마운트되기 전에 호출됩니다. 상태기반 컴포넌트는 이를 구현하고 초기 상태 데이터를 리턴합니다.
* `componentWillMount()`는 마운팅되기 직전에 호출됩니다.
* `componentDidMount()`는 마운팅 직후 호출됩니다. 초기화에 필요한 DOM 노드는 이곳에 있어야 합니다.

### Updating

* `componentWillReceiveProps(object nextProps)`는 마운트된 컴포넌트가 새로운 props을 받을 때 호출됩니다. 이 메소드는 `this.props`와 `nextProps`을 비교하여 `this.setState()`를 사용해 상태 변환을 수행하는데 사용되야 합니다.
* `shouldComponentUpdate(object nextProps, object nextState): boolean`는 컴포넌트가 어떤 변경이 DOM의 업데이트를 보증하는지 결정해야 할 때 호출됩니다. 최적화하려면, React가 업데이트를 무시해야할 때 `this.props`와 `nextProps`를, `this.state`와 `nextState`를 비교해 `false`를 리턴하면 됩니다.
* `componentWillUpdate(object nextProps, object nextState)`는 업데이트가 발생하기 직전에 호출됩니다. 이 시점에는 `this.setState()`를 호출할 수 없습니다.
* `componentDidUpdate(object prevProps, object prevState)`는 업데이트가 발생한 후 즉시 호출됩니다.

### Unmounting

* `componentWillUnmount()`는 컴포넌트가 언마운트되어 파괴되기 직전에 호출됩니다. 정리(Cleanup)는 여기서 처리해야 합니다.

### Mounted 메소드

_마운트된_ 합성 컴포넌트들은 다음과 같은 메소드를 지원합니다:

* `component.forceUpdate()`는 `this.setState()`를 사용하지 않고 변경된 컴포넌트의 상태의 변경을 적용하고 싶을 때 마운트된 컴포넌트에서 사용할 수 있습니다.

## 브라우저 지원과 Polyfill

페이스북에서 우리는 IE8을 포함한 구식 브라우저를 지원합니다. 미래지향적인 JS를 작성할 수 있도록 우리는 polyfill을 오랫동안 써왔습니다. 이는 우리의 코드베이스에 구식 브라우저를 위한 코드뭉치를 흩뿌려 놓을 필요가 없으며 그럼에도 우리의 코드가 "잘 작동"할 것이라 예상할 수 있음을 의미합니다. 예를 들어, `+new Date()` 대신에 그냥 `Date.now()`를 사용할 수 있습니다. 오픈소스 React는 우리가 내부에서 사용하는것과 동일하기 때문에, 우리는 이를 통해 미래지향적인 JS를 사용하는 철학을 전달했습니다.

그 철학에 더하여, 우리는 또한 JS 라이브러리의 저자로서 polyfill을 라이브러리에 포함해서 배포하지 않습니다. 만약 모든 라이브러리가 이런 짓을 하면, 같은 polyfill을 여러 번 내리게 되어 쓸모없이 크기만 차지하는 죽은 코드들을 만들 것 입니다. 당신의 제품이 구식 브라우저를 지원해야한다면, [es5-shim](https://github.com/es-shims/es5-shim) 같은 녀석을 사용할 기회가 있었을 겁니다.

### Polyfill은 구식 브라우저를 지원하기 위해 필요하다

[kriskowal's es5-shim](https://github.com/es-shims/es5-shim)의 `es5-shim.js`는 React에 필요한 다음의 기능을 제공합니다:

* `Array.isArray`
* `Array.prototype.every`
* `Array.prototype.forEach`
* `Array.prototype.indexOf`
* `Array.prototype.map`
* `Date.now`
* `Function.prototype.bind`
* `Object.keys`
* `String.prototype.split`
* `String.prototype.trim`

[kriskowal's es5-shim](https://github.com/kriskowal/es5-shim)의 `es5-sham.js`는, React에 필요한 다음의 기능도 제공합니다:

* `Object.create`
* `Object.freeze`

압축되지 않은 React 빌드는 [paulmillr의 console-polyfill](https://github.com/paulmillr/console-polyfill)에서 다음의 기능이 필요합니다.

* `console.*`

`<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`등 HTML5 엘리먼트를 IE8에서 이용하려면 [html5shiv](https://github.com/aFarkas/html5shiv)같은 스크립트가 추가로 필요합니다.

### 크로스 브라우징 이슈

React가 브라우저별 차이점을 썩 잘 추상화하긴 했지만 일부는 한정적이거나 우리가 발견하지 못한 이상한(quirky) 동작을 보여주기도 합니다.

#### IE8에서의 onScroll 이벤트

IE8에서는 `onScroll` 이벤트가 일어나지(bubble) 않으며, IE8은 이벤트의 캡쳐링 단계를 위한 핸들러를 정의하는 API를 갖고 있지 않습니다. 이는 React가 이 이벤트를 이해(listen) 할 방법이 없음을 뜻합니다. 현재 이 이벤트 핸들러는 IE8에서 무시됩니다.

더 많은 정보는 [onScroll doesn't work in IE8](https://github.com/facebook/react/issues/631) GitHub 이슈를 살펴보세요.
