---
id: top-level-api-ko-KR
title: 최상위 API
permalink: top-level-api-ko-KR.html
next: component-api-ko-KR.html
redirect_from: "/docs/reference-ko-KR.html"
---

## React

`React`는 React 라이브러리의 진입점입니다. 미리 빌드된 패키지를 사용하는 경우 전역 변수로 접근할 수 있습니다. CommonJS 모듈을 사용하는 경우에는 `require()`로 불러올 수 있습니다.


### React.Component

```javascript
class Component
```

ES6 클래스 구문을 사용해 React 컴포넌트를 정의했을 때 기본 클래스가 되는 부분입니다. 어떻게 ES6 클래스 구문을 사용해 React를 다루는지는 [재사용가능한 컴포넌트](/react/docs/reusable-components-ko-KR.html#es6-classes)를 확인하세요. 기본 클래스에서 실제 제공되는 메소드들에는 어떤것이 있는지 알아보려면 [컴포넌트 API](/react/docs/component-api-ko-KR.html)를 확인하세요.


### React.createClass

```javascript
ReactClass createClass(object specification)
```

주어진 명세에 따라 컴포넌트 클래스를 만듭니다. 컴포넌트는 단 하나의 자식만을 리턴하는 `render` 메소드를 구현합니다. 그 자식은 임의 깊이의 자식 구조를 가질 수 있습니다. 컴포넌트가 일반적인 프로토타입 기반의 클래스와 다른 점은 생성할 때 `new` 연산자를 사용하지 않아도 된다는 것입니다. 컴포넌트는 (`new` 연산자를 통해) 내부 인스턴스를 만들어 주는 편의 래퍼(wrapper)입니다.

명세 객체에 대한 자세한 정보는 [컴포넌트 명세와 생명주기](/react/docs/component-specs-ko-KR.html)를 참고하세요.


### React.createElement

```javascript
ReactElement createElement(
  string/ReactClass type,
  [object props],
  [children ...]
)
```

주어진 타입의 새 `ReactElement`를 만들고 리턴합니다. `type` 인자는 HTML 태그명 문자열 (예: 'div', 'span' 등) 또는 (`React.createClass`로 만든) `ReactClass`입니다.


### React.cloneElement

```
ReactElement cloneElement(
  ReactElement element,
  [object props],
  [children ...]
)
```

`element`를 시작점으로 새로운 `ReactElement`를 클론해 반환합니다. 반환된 엘리먼트에는 원본의 props와 새로운 props가 얕게 병합됩니다. 새 자식은 존재하는 자식을 교체할 것입니다. `React.addons.cloneWithProps`와는 다르게, 원본 엘리먼트의 `key`와 `ref`는 보존될 것입니다. `cloneWithProps`와는 달리 props이 병합되는데는 어떠한 특별한 동작도 없습니다. [v0.13 RC2 블로그 포스트](/react/blog/2015/03/03/react-v0.13-rc2.html)에서 추가적인 내용을 확인하세요.


### React.createFactory

```javascript
factoryFunction createFactory(
  string/ReactClass type
)
```

주어진 타입의 ReactElement를 만들어주는 함수를 리턴합니다. `React.createElement`와 마찬가지로 `type` 인자는 HTML 태그명 문자열 (예: 'div', 'span' 등) 또는 `ReactClass`입니다.


### React.isValidElement

```javascript
boolean isValidElement(* object)
```

주어진 객체가 ReactElement인지 확인합니다.


### React.DOM

`React.DOM`은 DOM 컴포넌트에 대해 `React.createElement`의 편의 래퍼(wrapper)를 제공합니다. JSX를 사용하지 않는 경우에만 사용하십시오. 예를 들어, `React.DOM.div(null, 'Hello World!')`와 같이 사용할 수 있습니다.


### React.PropTypes

`React.PropTypes`는 컴포넌트에 넘어오는 props가 올바른지 검사할 수 있는 컴포넌트의 `propTypes` 객체에 들어가는 타입을 가집니다. `propTypes`에 대한 자세한 정보는 [재사용 가능한 컴포넌트](/react/docs/reusable-components-ko-KR.html)를 참고하세요.


### React.Children

`React.Children`은 불투명한 자료 구조인 `this.props.children`를 다룰 수 있는 유틸리티를 제공합니다.

#### React.Children.map

```javascript
array React.Children.map(object children, function fn [, object thisArg])
```

`children`의 바로 밑에 있는 모든 자식에 `fn`을 호출합니다. 이 때 `this`는 `thisArg`로 설정됩니다. `children`이 중첩된 객체나 배열일 경우 그 안의 값을 순회합니다. 따라서 `fn`에 컨테이너 객체가 넘어가는 일은 일어나지 않습니다. `children`이 `null`이거나 `undefined`면 배열 대신 `null` 또는 `undefined`를 리턴합니다.

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object thisArg])
```

`React.Children.map()`과 비슷하지만 배열을 리턴하지 않습니다.

#### React.Children.count

```javascript
number React.Children.count(object children)
```

`children`에 들어있는 컴포넌트의 총 갯수를 리턴합니다. 이 갯수는 `map`이나 `forEach`에 넘긴 콜백이 호출되는 횟수와 동일합니다.

#### React.Children.only

```javascript
object React.Children.only(object children)
```

`children`에 단 하나의 자식이 있을 때 그 자식을 리턴합니다. 그 밖의 경우에는 예외를 발생시킵니다.

#### React.Children.toArray

```javascript
array React.Children.toArray(object children)
```

불투명한 자료구조인 `children`를 개별 자식마다 키를 할당해 평면 배열로 리턴합니다. 이는 render 메소드 내에서 자식의 컬렉션을 조작할 때, 특히 `this.props.children`을 넘기기 전에 재정렬하거나 재단할 때 유용합니다.   

## ReactDOM

`react-dom` 패키지는 앱의 최상위 레벨에서 사용될 DOM 고유의 메소드를 제공하며, 원한다면 리액트 외부모델을 위한 출구로 사용될 수 있습니다. 대부분의 컴포넌트는 이 모듈을 사용할 필요가 없습니다. 

### ReactDOM.render

```javascript
ReactComponent render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

주어진 ReactElement를 `container` 인자에 넘어온 DOM 안에 렌더링하고 컴포넌트의 [레퍼런스](/react/docs/more-about-refs-ko-KR.html)를 컴포넌트에 리턴합니다. [상태가 없는 컴포넌트](/react/docs/reusable-components-ko-KR.html#stateless-functions)에서는 `null`을 리턴합니다. 

어떤 ReactElement가 이미 `container`에 렌더링 된 적이 있다면, 그것을 업데이트한 뒤 React 컴포넌트의 최신 상태를 반영하기 위해 꼭 필요한 만큼만 DOM을 변경합니다.

콜백 인자를 넘기면 컴포넌트가 렌더링되거나 업데이트 된 다음 호출됩니다.

> 주의:
>
> `ReactDOM.render()`는 넘어온 컨테이너 노드의 내용을 교체합니다. 안에 있는 DOM 엘리먼트는 첫 호출을 할 때 교체됩니다. 그 후의 호출에는 효율석으로 업데이트하기 위해 React의 DOM diff 알고리즘을 사용합니다.
>
> `ReactDOM.render()`는 컨테이너 노드를 수정하지 않습니다. (컨테이너의 자식만 수정함) 추후에 기존 자식들을 덮어쓰지 않고 이미 있는 DOM 노드에 컴포넌트를 삽입하는 것도 지원할 가능성이 있습니다.


### ReactDOM.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

DOM에 마운트된 React 컴포넌트를 제거하고 이벤트 핸들러 및 state를 정리합니다. 컨테이너에 마운트된 컴포넌트가 없는 경우에는 호출해도 아무 동작을 하지 않습니다. 컴포넌트가 마운트 해제된 경우 `true`를, 마운트 해제할 컴포넌트가 없으면 `false`를 리턴합니다.


### ReactDOM.findDOMNode

```javascript
DOMElement findDOMNode(ReactComponent component)
```
이 컴포넌트가 DOM에 마운트된 경우 해당하는 네이티브 브라우저 DOM 엘리먼트를 리턴합니다. 이 메소드는 폼 필드의 값이나 DOM의 크기/위치 등 DOM에서 정보를 읽을 때 유용합니다. **대부분의 경우, DOM 노드에 ref를 쓸 수 있으며 `findDOMNode`를 사욯할 필요는 없습니다.** `render`가 `null`이나 `false`를 리턴할 때 `findDOMNode()`는 `null`을 리턴합니다.

> 주의:
>
> `findDOMNode()`는 기본 DOM 노드에 접근하기 위한 출구입니다. 컴포넌트 추상화를 파괴하기 때문에 대부분의 경우 이것의 사용은 권장되지 않습니다.
>
> `findDOMNode()`는 마운트된 컴포넌트에서만 작동합니다. 이는 컴포넌트가 DOM에 위치해야 함을 뜻합니다. 만약 아직 생성되기전의 컴포넌트에서 `render()`에서 `findDOMNode()`를 호출하는 등 컴포넌트가 마운트 되기 이전에 이를 호출한다면, 예외가 던져질 것입니다.  
>
> `findDOMNode()`는 상태가없는 컴포넌트에서 쓸 수 없습니다.

## ReactDOMServer

`react-dom/server` 패키지는 서버단에서 컴포넌트를 렌더할 수 있도록 해 줍니다.

### ReactDOMServer.renderToString

```javascript
string renderToString(ReactElement element)
```

주어진 ReactElement의 최초 HTML을 렌더링합니다. 이 함수는 서버에서만 사용해야 합니다. React가 HTML 문자열을 리턴합니다. HTML을 서버에서 생성하고 마크업을 최초 요청에 내려보내서, 페이지 로딩을 빠르게 하거나 검색 엔진이 크롤링할 수 있도록 하는 SEO 목적으로 이 메소드를 사용할 수 있습니다.

또한 이 메소드로 서버에서 렌더링한 마크업을 포함한 노드에 `ReactDOM.render()`를 호출하면, React는 마크업을 보존하고 이벤트 핸들러만 붙이므로 최초 로딩을 매우 빠르게 느껴지게 할 수 있습니다.


### ReactDOMServer.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

`renderToString`와 비슷하지만 `data-react-id`처럼 React에서 내부적으로 사용하는 추가적인 DOM 어트리뷰트를 만들지 않습니다. 추가적인 어트리뷰트를 제거하면 생성되는 마크업의 용량을 줄일 수 있기 때문에 React를 단순한 정적 페이지 생성기로 사용할 때 유용합니다.
