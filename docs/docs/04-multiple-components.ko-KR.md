---
id: multiple-components-ko-KR
title: 복합 컴포넌트
permalink: multiple-components-ko-KR.html
prev: interactivity-and-dynamic-uis-ko-KR.html
next: reusable-components-ko-KR.html
---

지금까지, 단일 컴포넌트에서 데이터를 표시하고 유저 입력을 다루는 것을 살펴보았습니다. 다음엔 React의 최고의 기능 중 하나인 조합가능성(composability)을 살펴봅시다.

## 동기: 관심의 분리

명확히 정의된 인터페이스와 다른 컴포넌트를 재사용해 모듈러 컴포넌트를 구축하면, 함수와 클래스를 이용했을 때 얻을 수 있는 이점 대부분을 얻을 수 있습니다. 특히 앱에서 *다른 관심을 분리*할 수 있습니다.아무리 간단히 새 컴포넌트를 만들었다고 해도 말이죠. 당신의 애플리케이션에서 쓸 커스텀 컴포넌트 라이브러리를 만들어서, 당신의 도메인에 최적화된 방법으로 UI를 표현할 수 있게 됩니다.

## 조합(Composition) 예제

간단히 페이스북 그래프 API를 사용해 프로필 사진과 유저이름을 보여주는 아바타 컴포넌트를 만든다고 합시다.

```javascript
var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <ProfilePic username={this.props.username} />
        <ProfileLink username={this.props.username} />
      </div>
    );
  }
});

var ProfilePic = React.createClass({
  render: function() {
    return (
      <img src={'https://graph.facebook.com/' + this.props.username + '/picture'} />
    );
  }
});

var ProfileLink = React.createClass({
  render: function() {
    return (
      <a href={'https://www.facebook.com/' + this.props.username}>
        {this.props.username}
      </a>
    );
  }
});

ReactDOM.render(
  <Avatar username="pwh" />,
  document.getElementById('example')
);
```

## 소유권(Ownership)

위의 예제에서, `Avatar` 인스턴스는  `ProfilePic`과 `ProfileLink`인스턴스를 *가지고* 있습니다. React에서 **소유자는 다른 컴포넌트의 `props`를 설정하는 컴포넌트입니다**. 더 정식으로 말하면, `X` 컴포넌트가 `Y` 컴포넌트의 `render()` 메소드 안에서 만들어졌다면, `Y`가 `X`를 *소유하고* 있다고 합니다. 앞에서 설명한 바와 같이, 컴포넌트는 자신의 `props`를 변경할 수 없습니다. `props`는 언제나 소유자가 설정한 것과 일치합니다. 이와 같은 근본적인 불변성은 UI가 일관성 있도록 해줍니다.

소유(owner-ownee)관계와 부모·자식 관계를 구별하는 것은 중요합니다. 부모·자식 관계가 DOM에서부터 쓰던 익숙하고 이미 알고있던 단순한 것인 한편, 소유관계는 React 고유의 것입니다.  위의 예제에서, `Avatar`는 `div`, `ProfilePic`, `ProfileLink`인스턴스를 소유하고, `div`는 `ProfilePic`과 `ProfileLink`인스턴스의 (소유자가 아닌) **부모**입니다.

## 자식

React 컴포넌트 인스턴스를 만들 때, 추가적인 React 컴포넌트나 JavaScript 표현식을 시작과 끝 태그 사이에 넣을 수 있습니다. 이렇게 말이죠.

```javascript
<Parent><Child /></Parent>
```

`Parent`는 `this.props.children`라는 특수 prop으로 자식들을 읽을 수 있습니다. **`this.props.children` 는 불투명한 데이터 구조이며,** [React.Children 유틸리티](/react/docs/top-level-api-ko-KR.html#react.children)를 사용해 자식들을 관리합니다.

### 자식 Reconciliation (비교조정)

**Reconciliation은 React가 DOM을 각각 새로운 렌더 패스에 업데이트하는 과정입니다.** 일반적으로, 자식은 렌더하는 순서에 따라 비교조정됩니다. 예를 들어, 각각의 마크업을 생성하는 두 개의 렌더 패스가 있다고 해봅시다.

```html
// Render Pass 1
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// Render Pass 2
<Card>
  <p>Paragraph 2</p>
</Card>
```

직관적으로 보면, `<p>Paragraph 1</p>`가 없어졌습니다만 그러는 대신에, React는 첫 번째 자식의 텍스트를 비교조정하고 마지막 자식을 파괴하도록 DOM을 비교조정할 것입니다. React는 자식들의 *순서*에 따라 비교조정합니다.

### 상태기반(Stateful) 자식

대부분의 컴포넌트에서는, 이것은 큰 문제가 아닙니다. 하지만 렌더 패스 간에 `this.state`를 유지하는 상태기반의 컴포넌트에서는 매우 문제가 될 수 있습니다.

대부분의 경우, 이 문제는 엘리먼트를 파괴하지 않고 숨김으로써 피해갈 수 있습니다.

```html
// Render Pass 1
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// Render Pass 2
<Card>
  <p style={{'{{'}}display: 'none'}}>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
```

<a name="dynamic-children"></a>
### 동적 자식

자식들이 섞이거나(검색의 결과같은 경우) 새로운 컴포넌트가 목록의 앞에 추가(스트림같은 경우)된다면 상황은 점점 더 까다로워집니다. 이런 때에의 동일성과 각 자식의 상태는 반드시 렌더 패스 간에 유지돼야 합니다. 각 자식에 `key`를 할당 함으로써 독자적으로 식별할 수 있습니다.

```javascript
  render: function() {
    var results = this.props.results;
    return (
      <ol>
        {results.map(function(result) {
          return <li key={result.id}>{result.text}</li>;
        })}
      </ol>
    );
  }
```

React가 키가 있는 자식들을 비교조정할 때, React는 `key`가 있는 자식이 (오염(clobbered)되는 대신) 재배치되고 (재사용되는 대신) 파괴되도록 보장할 것입니다.

`key`는 *항상* 배열 안의 각 컴포넌트의 컨테이너 HTML 자식이 아닌 컴포넌트에게 직접 주어져야 합니다.

```javascript
// 틀림!
var ListItemWrapper = React.createClass({
  render: function() {
    return <li key={this.props.data.id}>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
          return <ListItemWrapper data={result}/>;
        })}
      </ul>
    );
  }
});
```
```javascript
// 맞음 :)
var ListItemWrapper = React.createClass({
  render: function() {
    return <li>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
           return <ListItemWrapper key={result.id} data={result}/>;
        })}
      </ul>
    );
  }
});
```

ReactFragment 객체를 넘기는 것으로 자식에 키를 할당할 수도 있습니다. 자세한 내용은 [키가 할당된 프래그먼트](create-fragment-ko-KR.html)를 참고하세요.

## 데이터 흐름

React에서 데이터는 위에서 말한 것처럼 `props`를 통해 소유자로부터 소유한 컴포넌트로 흐릅니다. 이것은 사실상 단방향 데이터 바인딩입니다. 소유자는 `props`나 `state`를 기준으로 계산한 어떤 값으로 소유한 컴포넌트의 props를 바인드합니다. 이 과정은 재귀적으로 발생하므로, 데이터의 변경은 자동으로 모든 곳에 반영됩니다.

## 성능의 주의점

소유자가 가지고 있는 노드의 수가 많아지면 데이터가 변화하는 비용이 증가할 것으로 생각할 수도 있습니다. 좋은 소식은 JavaScript의 속도는 빠르고 `render()` 메소드는 꽤 간단한 경향이 있어, 대부분 애플리케이션에서 매우 빠르다는 점입니다. 덧붙여, 대부분의 병목 현상은 JS 실행이 아닌 DOM 변경에서 일어나고, React는 배치와 탐지 변경을 이용해 최적화해 줍니다.

하지만, 가끔 성능을 위해 정교하게 제어해야 할 때도 있습니다. 이런 경우, React가 서브트리의 처리를 건너 뛰도록 간단히 `shouldComponentUpdate()`를 오버라이드해 false를 리턴하게 할 수 있습니다. 좀 더 자세한 정보는 [React 참조 문서](/react/docs/component-specs-ko-KR.html)를 보세요.

> 주의:
>
> 데이터가 실제로는 변경되었지만 `shouldComponentUpdate()`가 false를 리턴한다면 React는 UI를 싱크시킬수 없습니다. 이 기능을 사용할 때에는 자신이 지금 무엇을 하고 있는지 알고 있고, 눈에 띄는 성능 문제가 있을 경우에만 사용하세요. JavaScript는 DOM에 비해 빠릅니다. 과소평가하지 마세요.
