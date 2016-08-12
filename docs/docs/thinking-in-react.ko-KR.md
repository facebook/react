---
id: thinking-in-react-ko-KR
title: 리액트로 생각해보기
permalink: docs/thinking-in-react-ko-KR.html
prev: tutorial-ko-KR.html
next: videos-ko-KR.html
---

Pete Hunt의 글입니다.

제가 생각하기에, React는 JavaScript로 크고 빠른 웹 애플리케이션을 만드는데 최고입니다. 페이스북과 인스타그램에서 우리에게 잘 맞도록 조정되어 왔습니다.

React의 많은 뛰어난 점들 중 하나는 생각을 하면서 애플리케이션을 만들게 한다는 겁니다. 이 포스트에서, React를 이용해 검색이 가능한 상품자료 테이블을 만드는 생각 과정을 이해할 수 있게 차근차근 설명할 겁니다.

## 모형으로 시작해보기

우리가 이미 JSON API와 디자이너로부터 넘겨받은 모형을 이미 가지고 있다고 생각해봅시다. 보시다시피 우리 디자이너는 별로 좋지 않습니다:

![Mockup](/react/img/blog/thinking-in-react-mock.png)

우리의 JSON API는 아래와 같은 데이터를 리턴합니다:

```
[
  {category: "Sporting Goods", price: "$49.99", stocked: true, name: "Football"},
  {category: "Sporting Goods", price: "$9.99", stocked: true, name: "Baseball"},
  {category: "Sporting Goods", price: "$29.99", stocked: false, name: "Basketball"},
  {category: "Electronics", price: "$99.99", stocked: true, name: "iPod Touch"},
  {category: "Electronics", price: "$399.99", stocked: false, name: "iPhone 5"},
  {category: "Electronics", price: "$199.99", stocked: true, name: "Nexus 7"}
];
```

## 1단계: UI를 계층 구조의 컴포넌트로 분쇄하세요.

당신이 하고싶은 첫번째는 모형에 있는 모든 컴포넌트 (그리고 자식엘리먼트) 주위에 상자를 그리고, 이름을 부여하는 것입니다. 만약 당신이 디자이너와 같이 작업중이라면, 그들은 이미 이 작업을 해놨을지도 모릅니다. 당장 가서 이야기해보세요. 그들의 포토샵 레이어 이름이 결국 당신의 React 컴포넌트들의 이름이 될 것입니다.

그런데 무엇이 컴포넌트가 되어야 할까요? 당신이 새로운 함수나 객체를 만들어야만 한다면, 똑같이 적용하세요. 한가지 방법은 [단일 책임의 원칙](http://ko.wikipedia.org/wiki/%EB%8B%A8%EC%9D%BC_%EC%B1%85%EC%9E%84_%EC%9B%90%EC%B9%99) 입니다. 즉 하나의 컴포넌트는 이상적으로 한가지 작업만 수행해야 합니다. 컴포넌트가 결국 커진다면, 작은 자식 컴포넌트로 쪼개져야 합니다.

주로 JSON 데이터 모델을 사용자에게 보여주기 때문에, 자료 모델이 잘 설계 되었다면, UI(혹은 컴포넌트 구조)가 잘 맞아 떨어진다는 것을 알게 될 겁니다. UI와 자료 모델은 같은 *정보 설계구조*로 따라가는 경향이 있기 때문입니다. 즉, UI를 컴포넌트들로 쪼개는 작업은 크게 어렵지 않습니다. 확실하게 각각 하나의 부분이 되도록 쪼개세요.

![Component diagram](/react/img/blog/thinking-in-react-components.png)

이 간단한 애플리케이션에는 다섯개의 컴포넌트가 있습니다. 각 컴포넌트들이 대표하는 자료를 기울여 표기했습니다.

  1. **`FilterableProductTable` (오렌지):** 예제 전부를 포함합니다.
  2. **`SearchBar` (파랑):** 모든 *사용자 입력* 을 받습니다.
  3. **`ProductTable` (초록):** *자료 모음*을 *사용자 입력*에 맞게 거르고 보여줍니다.
  4. **`ProductCategoryRow` (청록):** 각 *카테고리*의 제목을 보여줍니다.
  5. **`ProductRow` (빨강):** 각 *프로덕트*를 보여줍니다.

`ProductTable`을 보면, 테이블 제목("Name", "Price" 라벨들을 포함한)은 컴포넌트가 아닌것을 알 수 있습니다. 이건 기호의 문제이고, 어느쪽으로 만들던 논쟁거리입니다. 이 예제에서는, 저는 *자료 모음*을 그리는 `ProductTable`의 의무라고 생각했기 때문에 남겨 두었습니다. 하지만, 이 제목이 복잡해진다면 (예를 들어 정렬을 추가할 여유가 있다거나 하는), 이건 확실히 `ProductTableHeader` 컴포넌트로 만드는 것이 맞을 겁니다.

이제 모형에 들어있는 컴포넌트들에 대해 알아보았으니, 계층 구조로 만들어 봅시다. 이건 쉽습니다. 다른 컴포넌트 속에 들어있는 컴포넌트를 자식으로 나타내기만 하면 됩니다.

  * `FilterableProductTable`
    * `SearchBar`
    * `ProductTable`
      * `ProductCategoryRow`
      * `ProductRow`

## 2단계: 정적 버전을 만드세요.

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/yun1vgqb/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

계층구조의 컴포넌트들을 가지고 있으니, 이젠 애플리케이션을 구현할 시간입니다. 가장 쉬운 방법은 상호작용을 하지 않는 채로 자료 모델을 이용해 UI를 그리는 것입니다. 정적 버전을 만드는 데에는 적은 생각과 많은 노동이 필요하고, 상호작용을 추가하는 데에는 많은 생각과 적은 노동이 필요하기 때문에 둘을 분리하는 것이 가장 좋습니다. 왜 그런지 봅시다.

자료 모델을 그리는 애플리케이션의 정적버전을 만들기 위해서, 다른 컴포넌트에 재사용할 컴포넌트를 만들고 자료 전달을 위해 *props*를 사용하고 싶을 것입니다. 만약 *상태*라는 개념에 익숙하다면, 정적 버전을 만들때 **절대 상태를 사용하지 마세요**. 상태는 오직 상호작용, 즉 가변적인 자료를 위해서만 준비되어 있습니다. 정적 버전을 만들 때는 필요가 없습니다.

껍데기부터 혹은 속알맹이부터 만들 수 있습니다. 즉 계층구조상 위에서부터 (`FilterableProductTable` 부터) 혹은 아래에서부터 (`ProductRow`), 어느 방향에서든 시작해도 됩니다. 통상 큰 프로젝트에서는 계층구조상 위에서부터 시작하는 것이 쉽고, 테스트를 작성할때는, 아래에서부터 시작하는 것이 쉽습니다.

이 단계의 결과, 자료 모델을 그리는 재활용 가능한 컴포넌트의 라이브러리를 갖게 되었습니다. 정적버전 이후로 컴포넌트들은 오직 `render()` 메소드만 갖고 있습니다. 계층구조상 가장 위의 컴포넌트 (`FilterableProductTable`)은 자료 모델을 prop으로 취할 것입니다. 자료 모델이 변했을 때, `ReactDOM.render()`를 다시 부르면 UI가 업데이트 됩니다. 어떻게 UI가 업데이트 되는지 참 알기 쉽습니다. 자료가 바뀌어도 처리해야 할 복잡한 일이 아무것도 없습니다. React의 **단일 방향 자료 흐름** (혹은 *단일방향 바인딩*)이 모든것을 모듈식으로, 추론하기 쉽게, 그리고 빠르게 유지해줍니다.

이 단계를 진행하는 데에 도움이 필요하시다면, [React 문서](/react/docs/getting-started-ko-KR.html)를 참조하세요.

### 잠시만: props vs state

React 에는 두가지 타입의 자료 "모델"이 있습니다: props 와 state. 두가지의 구분점을 이해하는데 매우 중요합니다; 혹시 차이점을 확신하지 못한다면 걷어내세요 [공식 문서](/react/docs/interactivity-and-dynamic-uis-ko-KR.html).

## 3단계: UI state 의 표현을 작지만 완전하도록 확인하세요.

상호적인 UI를 만들기 위해서는, 자료 모델 변화에 반응할 수 있어야 합니다. React는 **state**로 이걸 쉽게 만들어주죠.

올바르게 애플리케이션을 만들기 위해서는, 첫째로 애플리케이션에 필요한 변할 수 있는 state 들의 최소한의 집합에 대해서 생각해볼 필요가 있습니다. 여기 방법이 있습니다: *스스로 반복하지 마세요* (DRY). 애플리케이션의 상태를 나타낼 수 있는 가장 최소한의 표현 방식을 찾고, 그 밖의 것은 필요할 때 계산합니다. 예를들어 TODO 목록를 만든다고 칩시다. TODO 아이템들의 배열만 유지하세요; 갯수를 표현하기 위한 state 변수를 분리하지 마세요. 대신 TODO 아이템들 배열의 길이를 이용하세요.

예제 애플리케이션에서의 모든 자료유형에 대해 생각해 봅시다:

  * product 들의 원본 목록
  * 사용자가 입력한 검색어
  * 체크박스의 값
  * product 들의 필터된 목록

어느것이 state 가 될지 따져봅시다. 간단하게 각 자료에 대해 세가지만 생각해 보세요.

  1. 만약 부모로부터 props 를 이용해 전달됩니까? 그렇다면 이건 state가 아닙니다.
  2. 종종 바뀝니까? 아니라면 이것 역시 state가 아닙니다.
  3. 컴포넌트에 있는 다른 state나 props를 통해서 계산되어질 수 있습니까? 역시 state가 아닙니다.

product 들의 원본 목록은 props를 통해서 전달되기 때문에, state가 아닙니다. 검색어와 체크박스의 값은 다른것에 의해 계산될 수 있는 값이 아니고, 시시각각 변하기때문에 state가 맞습니다. 마지막으로 product 들의 걸러진 목록 역시 state가 아닙니다. 원본 목록과 검색어, 체크박스의 값 등에 의해 연산되어지는 값이기 때문이죠.

결국, state는 다음과 같습니다:

  * 사용자가 입력한 검색어
  * 체크박스의 값

## 4단계: 어디서 state가 유지되어야 하는지 확인하세요.

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/zafjbw1e/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

이제 최소한의 state가 무엇인지 알아냈습니다. 다음은, 어떤 컴포넌트가 이 state를 변형하거나 만들어낼지 알아내야 합니다.

기억하세요: React는 계층적 아래 컴포넌트로만 향하는 단일방향성 자료 흐름을 가집니다. 지금당장은 어떤 컴포넌트가 자기 자신의 state를 가져야 할지 명확하지 않을 것입니다. **이것이 초심자가 가장 이해하기 어려운 부분입니다**. 이제 개념을 명확히 하기 위해 다음으로 따라가 봅시다:

애플리케이션에서 state의 경우:

  * 모든 컴포넌트가 state를 통해 무언가를 그려냅니다.
  * 대표 컴포넌트가 뭔지 찾으세요 (계층적으로 다른 컴포넌트들의 단일 상위 컴포넌트는 state를 가질 필요가 있습니다).
  * 대표 컴포넌트 혹은 또다른 컴포넌트는 가능한 상위의 컴포넌트가 state를 소유해야 합니다.
  * 만약 state를 가져야할 컴포넌트가 어느 것인지 모르겠으면, 새로운 컴포넌트를 만들어 state를 부여하고 기존의 대표 컴포넌트 위에 추가하세요.

이 전략을 우리 애플리케이션에 적용해 봅시다.

  * `ProductTable`은 state에 대해 걸러질 필요가 있고, `SearchBar` 역시 검색어 state와 체크박스 state를 보여줄 필요가 있습니다.
  * 대표 컴포넌트는 `FilterableProductTable` 입니다.
  * 개념적으로 검색어와 체크박스 값은 `FilterableProductTable`에 있어야 한다는 것이 명확합니다.

좋습니다. state를 `FilterableProductTable`에서 관리하도록 결정했습니다. 먼저, `getInitialState()` 메소드를 `FilterableProductTable`에 추가하세요. 이 메소드는 애플리케이션의 초기 state를 갖도록 `{filterText: '', inStockOnly: false}`를 리턴하면 됩니다. 그리고, `filterText`와 `inStockOnly` 를 `ProductTable`과 `SearchBar`에 prop으로 전달하세요. 마지막으로, 이 prop들을 `ProductTable`을 걸러내는 데, 그리고 `SearchBar` form fields의 값을 세팅하는데 사용하세요.

이제 어떻게 애플리케이션이 동작하는지 볼 수 있습니다: `filterText`를 `"ball"`로 설정하고 업데이트합니다. 자료 테이블이 제대로 업데이트 되는 것을 볼 수 있을 겁니다.

## 5단계: 반대방향 자료 흐름을 추가하세요.

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/n47gckhr/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

앞서 우리는 계층적으로 아랫방향 흐름의 props, state전달로 잘 동작하는 애플리케이션을 만들었습니다. 이제 다른방향의 자료 흐름을 지원할 시간입니다: form 컴포넌트들은 `FilterableProductTable`의 state를 업데이트할 필요성이 있죠.

React는 어떻게 이 프로그램이 동작하는지 이해하기 쉽게 이 자료의 흐름을 명시적으로 만들어주지만 전통적인 두 방향의 자료 바인딩보다 다소 입력할 것이 많습니다. React는 이러한 패턴을 양방향 바인딩처럼 편하게 사용할 수 있도록 ReactLink를 제공하지만, 이 글의 목적상 명시적인 방식만 사용했습니다.

지금 예제에 문자열을 입력하거나 체크박스를 체크하더라도, React가 입력을 무시하는것을 볼 수 있습니다. 의도적으로 `input`의 prop에 `value`를 세팅하면 항상 `state`가 `FilterableProductTable`로부터 전달되어야 합니다.

우리가 원하는 것이 무엇인지 생각해 봅시다. 사용자 입력을 반영하기 위해, 사용자가 form을 바꿀때마다 업데이트 하기를 원하죠. 컴포넌트들이 오직 자기 자신의 state만 업데이트 하더라도 `FilterableProductTable`은 state가 변할때마다 반영되어야할 `SearchBar`에 콜백을 전달할 것입니다. 이 알림을 위해서 `onChange`이벤트를 사용할 수 있습니다. 그리고 `FilterableProductTable`으로부터 전달된 콜백은 `setState()`를 호출할 것이고, 애플리케이션은 업데이트될 것입니다.

복잡하게 들릴 수 있지만, 실제로는 몇 줄 되지 않습니다. 그리고 애플리케이션의 구석구석에서 데이터가 어떻게 흐르는지 매우 명확해집니다.

## 그리고

이 글이 컴포넌트와 React로 애플리케이션을 어떻게 만들지에 대한 아이디어가 되길 바랍니다. 원래 하던 방식보다 조금 타이핑을 더 해야할지도 모르지만, 코드는 쓰는 경우보다 읽히는 경우가 많다는 점, 매우 읽기 편하고 명시적인 코드를 썼다는 점을 기억하세요. 컴포넌트로 큰 라이브러리를 만들기 시작할 때, 이 명시성과 모듈성에 감사하게 될 것이며, 재사용함에 따라 코드의 양도 줄어들 것입니다. :)
