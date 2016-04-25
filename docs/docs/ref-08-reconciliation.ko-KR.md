---
id: reconciliation-ko-KR
title: 비교조정(Reconciliation)
permalink: docs/reconciliation-ko-KR.html
prev: special-non-dom-attributes-ko-KR.html
next: webcomponents.html
---

React의 주요 설계 철학은 업데이트할 때마다 전체 앱을 다시 렌더하는 것처럼 보이게 API를 만드는 것입니다. 이렇게 하면 애플리케이션 작성이 훨씬 쉬워지지만 한편으로는 어려운 도전 과제이기도 합니다. 이 글에서는 강력한 휴리스틱으로 어떻게 O(n<sup>3</sup>) 복잡도의 문제를 O(n)짜리로 바꿀 수 있었는지 설명합니다.


## 동기

최소한의 연산으로 어떤 트리를 다른 트리로 바꾸는 것은 복잡하고 많이 연구된 문제입니다. n을 트리에 있는 노드 수라고 할 때 [최신 알고리즘](http://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf)은 O(n<sup>3</sup>) 복잡도를 가집니다.

다시 말해 1000개의 노드를 표시하려면 10억 번 수준의 비교를 해야 한다는 뜻입니다. 이는 우리가 필요한 용도로는 너무 비쌉니다. 이 수치를 좀 더 알기 쉽게 설명하면, 요즘 CPU는 1초에 대략 30억 번의 연산을 하므로 가장 빠른 구현으로도 1초 안에 이러한 비교는 계산해낼 수 없다는 것입니다.

최적의 알고리즘을 사용할 수 없기 때문에, 완전하진 않지만 다음의 두 가지 가정에 기반한 휴리스틱을 사용한 O(n) 알고리즘으로 구현했습니다.

1. 같은 클래스의 두 컴포넌트는 비슷한 트리를 생성하고, 서로 다른 클래스를 가진 두 컴포넌트는 서로 다른 트리를 생성할 것이다.
2. 각 렌더 과정들 사이에 유지되는 엘리먼트에 고유한 키를 제공할 수 있다.

실제로 이러한 가정은 거의 모든 실용적인 상황에서 굉장히 빠릅니다.


## 일대일 비교

트리 비교를 하기 위해서는 먼저 두 노드를 비교할 수 있어야 합니다. 세 가지 경우를 다룹니다.


### 서로 다른 노드 타입

두 노드의 타입이 서로 다르다면, React는 이를 두 개의 서로 다른 서브트리로 간주해 처음 것을 버리고 두번째 것을 만들어 삽입합니다.

```xml
renderA: <div />
renderB: <span />
=> [removeNode <div />], [insertNode <span />]
```

동일한 로직이 커스텀 컴포넌트에 대해서도 적용됩니다. 타입이 다르다면 React는 그 컴포넌트들이 무엇을 렌더하는지 조차도 비교하지 않습니다. 그저 처음 것을 DOM에서 제거하고 두번째 것을 삽입합니다.

```xml
renderA: <Header />
renderB: <Content />
=> [removeNode <Header />], [insertNode <Content />]
```

이러한 고수준의 사실을 알 수 있다는 것이 React의 비교 알고리즘이 빠르면서 정확할 수 있는 비결입니다. 트리의 커다란 부분을 일찌감치 탐색 대상에서 제외하고 비슷할 가능성이 높은 부분에 집중할 수 있는 좋은 휴리스틱을 제공합니다.

`<Header>` 엘리먼트가 생성하는 DOM이 `<Content>`가 생성하는 것과 비슷하게 생길 확률은 매우 낮습니다. 이 두 구조를 비교하는데 시간을 낭비하지 않고 React는 그냥 트리를 처음부터 새로 만듭니다.

한편 두 번의 연속적인 렌더에서 같은 위치에 `<Header>` 엘리먼트가 있다면 비슷한 구조일 것이므로 탐색할만 합니다.


### DOM 노드

두 DOM 노드를 비교할 때는 어트리뷰트를 보고 무엇이 바뀌었는지 선형 시간 안에 결정할 수 있습니다.

```xml
renderA: <div id="before" />
renderB: <div id="after" />
=> [replaceAttribute id "after"]
```

스타일을 불명확한 문자열로 다루지 않고 키-값 객체를 사용합니다. 이는 변경된 프로퍼티만 업데이트 하도록 해줍니다.

```xml
renderA: <div style={{'{{'}}color: 'red'}} />
renderB: <div style={{'{{'}}fontWeight: 'bold'}} />
=> [removeStyle color], [addStyle font-weight 'bold']
```

어트리뷰트가 업데이트된 다음에는, 모든 자식도 재귀적으로 업데이트합니다.


### 커스텀 컴포넌트

우리는 두 커스텀 컴포넌트를 같은 것으로 취급하기로 했습니다. 컴포넌트는 상태를 가지기 때문에 새 컴포넌트를 그냥 사용할 수는 없습니다. React는 새 컴포넌트의 모든 어트리뷰트를 취해 이전 컴포넌트의 `component[Will/Did]ReceiveProps()`를 호출해 줍니다.

이제 이전 컴포넌트가 작동합니다. 거기 있는 `render()` 메소드가 호출되고 비교 알고리즘이 다시 새로운 결과와 이전 결과를 비교합니다.


## 목록끼리 비교

### 문제가 되는 경우

React는 매우 단순한 방식으로 자식 비교조정(children reconciliation)을 합니다. 자식 목록을 동시에 서로 비교하다가 차이를 발견하면 변경 사항을 적용합니다.

예를 들어 맨 끝에 엘리먼트를 추가한 경우에는:

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>first</span><span>second</span></div>
=> [insertNode <span>second</span>]
```

맨 앞에 엘리먼트를 삽입하는 경우가 문제입니다. React는 두 노드가 모두 span인지 확인하고 변경 모드로 작동합니다.

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>second</span><span>first</span></div>
=> [replaceAttribute textContent 'second'], [insertNode <span>first</span>]
```

원소의 목록을 변환하기 위한 최소 연산 집합을 찾는 알고리즘이 여럿 있습니다. [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)를 사용하면 O(n<sup>2</sup>) 복잡도로 원소 한 개의 삽입, 삭제, 교체를 위해 필요한 최솟값을 찾을 수 있습니다. Levenshtein 알고리즘을 사용해도 노드가 다른 위치로 이동한 경우는 알아낼 수 없고, 그것을 알아내는 알고리즘은 더욱 높은 복잡도를 가집니다.

### 키(keys)

해결할 수 없어보이는 이 문제를 풀기 위해 선택적인 어트리뷰트를 도입했습니다. 각 자식에 키(key)를 할당해 이를 비교하는 데에 사용합니다. 키를 명시하면 React가 해시 테이블을 사용하여 삽입, 삭제, 교체 및 이동을 O(n) 복잡도로 찾아낼 수 있습니다.


```xml
renderA: <div><span key="first">first</span></div>
renderB: <div><span key="second">second</span><span key="first">first</span></div>
=> [insertNode <span>second</span>]
```

실제 상황에서 키를 찾는 것은 별로 어렵지 않습니다. 대부분의 경우, 표시하려는 엘리먼트는 이미 고유한 식별자를 가지고 있습니다. 그렇지 않은 경우에도 모델에 새로운 ID 프로퍼티를 추가하거나 내용의 일부분을 해시하여 키를 생성할 수 있습니다. 키는 형제 노드 사이에서만 고유하면 됩니다. 전역적으로 고유할 필요는 없습니다.


## 트레이드오프

비교조정 알고리즘이 구현 세부사항이라는 것을 기억하는 것은 중요합니다. React가 전체 앱을 모든 동작마다 새로 렌더해도 결과는 같을 것입니다. 일반적인 사용 패턴을 빠르게 만들 수 있도록 저희는 계속 휴리스틱을 다듬고 있습니다.

현재 구현에서 서브트리가 형제 노드 사이에서 이동하는 경우는 표현할 수 있지만, 그 외의 곳으로 이동했는지는 알 수 없습니다. 알고리즘에 따라 전체 서브트리가 다시 렌더됩니다.

두 가지 휴리스틱에 의존하기 때문에 그에 대한 가정이 만족되지 않으면 성능이 좋지 않을 것입니다.

1. 서로 다른 컴포넌트 클래스의 서브트리는 비교하려고 시도하지 않습니다. 만약 매우 비슷한 출력 결과의 두 컴포넌트를 왔다갔다 하는 경우 같은 클래스로 만들 수 있습니다. 실제 상황에서는 큰 문제가 없습니다.

2. 안정적인 키를 붙이지 않을 경우 (예를 들어 Math.random()을 사용한다거나) 모든 서브트리가 매번 다시 렌더될 것입니다. 사용자에게 키를 선택하도록 하는 대신 실수할 수 있는 여지가 있습니다.
