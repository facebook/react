---
id: tutorial-ko-KR
title: 튜토리얼
permalink: docs/tutorial-ko-KR.html
prev: getting-started-ko-KR.html
next: thinking-in-react-ko-KR.html
---

블로그에 붙일만한 간단하지만 실용적인 댓글상자를 만들어 볼 것입니다. Disqus, LiveFyre, Facebook에서 제공하는 것 같은 실시간 댓글의 간단한 버전이죠.

이런 기능을 넣겠습니다:

* 댓글목록
* 댓글작성폼
* 커스텀 백엔드를 위한 Hooks

멋진 기능도 조금 넣어보겠습니다:

* **낙관적 댓글 달기:** 댓글은 서버에 저장되기도 전에 목록에 나타납니다. 그래서 빠르게 느껴집니다.
* **실시간 업데이트:** 다른 사용자가 남기는 댓글이 실시간으로 나타납니다.
* **Markdown 지원:** 사용자는 글을 꾸미기 위해 Markdown 형식을 사용할 수 있습니다.

### 그냥 다 생략하고 소스만 보고 싶나요?

[GitHub에 전부 있습니다.](https://github.com/reactjs/react-tutorial)

### 서버 구동하기

이 튜토리얼을 시작하기 위해, 서버를 구동할 필요가 있습니다. 이 서버는 순수하게 우리가 받고 저장할 데이터의 API 엔드포인트로써만 사용합니다. 이를 가능한한 쉽게하기 위해, 필요한 것만 제공하는 간단한 서버를 몇가지 스크립트 언어로 만들었습니다. **시작하는데 필요한 모든 것이 들어있는 [소스](https://github.com/reactjs/react-tutorial/)를 보시거나 [zip 파일](https://github.com/reactjs/react-tutorial/archive/master.zip)을 다운로드 할 수 있습니다.**

단순하게 하기위해, 서버는 `JSON` 파일을 데이터베이스로 사용합니다. 프로덕션에서 사용할 수는 없지만 이렇게 하면 API를 사용할 때 시뮬레이션이 단순해집니다. 서버가 시작되면, API 엔드포인트를 제공하고 필요한 정적 페이지를 서빙합니다.

### 시작하기

이 튜토리얼에서는 가능한한 간단하게 만들겠습니다. 위에서 언급된 서버 패키지에 우리가 작업할 HTML 파일 포함되어 있습니다. 편한 편집기에서 `public/index.html`를 여세요. 이는 이런 내용이어야 합니다.(아마 조금 다를 수 있습니다만, 여기에 나중에 `<script>` 태그를 추가 할 것입니다.)

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>React Tutorial</title>
    <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
    <script src="https://unpkg.com/jquery@3.1.0/dist/jquery.min.js"></script>
    <script src="https://unpkg.com/remarkable@1.6.2/dist/remarkable.min.js"></script>
  </head>
  <body>
    <div id="content"></div>
    <script type="text/babel" src="scripts/example.js"></script>
    <script type="text/babel">
      // 이 튜토리얼을 시작하려면, 그냥 scripts/example.js를 로드하는 스크립트
      // 태그를 제거하고 여기에 코드를 적으세요.
    </script>
  </body>
</html>
```

다음 진행을 위해, 위의 스크립트 태그안에 JavaScript 코드를 작성합니다. (이 튜토리얼에서는) 진보된 라이브 리로드가 없기 때문에, 수정 사항을 저장한 다음에는 브라우저를 새로고침해서 확인해야 합니다. 서버를 시작한 다음 브라우저에서 `http://localhost:3000`를 열어 따라해 보세요. 아무런 수정도 하지 않았다면, 최초 로드시 우리가 만들 제품의 완성품을 확인할 수 있을 것입니다. 작업할 준비가 되면, 이전의 `<script>` 태그를 삭제하고 진행하세요.

> 주의:
>
> 여기서는 ajax 요청 코드를 단순화 하기 위해 jQuery를 넣었지만, 이는 React의 동작에 필수적인 것은 **아닙니다**.

### 첫 번째 컴포넌트

모듈화 된, 조합가능한 컴포넌트가 React의 전부입니다. 댓글상자 예제에서 우리는 다음과 같은 컴포넌트 구조를 가질 것입니다:

```
- CommentBox
  - CommentList
    - Comment
  - CommentForm
```

자, 이제 `CommentBox` 컴포넌트를 만들어 봅시다. `<div>` 하나로 구성되어 있습니다.

```javascript
// tutorial1.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        Hello, world! I am a CommentBox.
      </div>
    );
  }
});
ReactDOM.render(
  <CommentBox />,
  document.getElementById('content')
);
```

네이티브 HTML 엘리먼트 이름은 소문자로 시작하고 커스텀 React 클래스 이름은 대문자로 시작합니다.

#### JSX 문법

JavsScript 안의 유사 XML 구문이 먼저 눈에 띌 것입니다. 우리에겐 이를 JavaScript로 변환해주는 간단한 프리컴파일러(precompiler)가 있습니다.

```javascript
// tutorial1-raw.js
var CommentBox = React.createClass({displayName: 'CommentBox',
  render: function() {
    return (
      React.createElement('div', {className: "commentBox"},
        "Hello, world! I am a CommentBox."
      )
    );
  }
});
ReactDOM.render(
  React.createElement(CommentBox, null),
  document.getElementById('content')
);
```

JSX의 사용은 선택적이지만 JSX 문법이 일반 JavsScript보다 사용하기 쉽습니다. [JSX 문법 문서](/react/docs/jsx-in-depth.html)에서 더 알아보세요.

#### 무슨 일이 일어나고 있는가

우리는 새로운 React 컴포넌트를 만들기 위해 `React.createClass()`로 JavaScript 객체에 몇 개의 메소드를 담아 넘겼습니다. 이 중 가장 중요한것은 `render` 메소드인데, 이는 React 컴포넌트 트리를 리턴해서 최종적으로 실제 HTML을 그려주게 됩니다.

`<div>` 태그들은 실제 DOM 노드가 아니라 React `div` 컴포넌트의 인스턴스입니다. 이것은 React가 다룰 수 있는 데이터의 표시자(markers)나 조각이라 생각하셔도 됩니다. React는 **안전합니다**. 생(raw) HTML 문자열을 생성하는 것이 아니기 때문에 XSS을 기본적으로 방지합니다.

일반적인 HTML만 리턴할 수 있는 것은 아닙니다. 여러분이 직접 만든 (또는 다른 사람들이 만들어 놓은) 컴포넌트의 트리를 리턴할 수도 있습니다. 이것이 React를 **조합가능(composable)하게 만듭니다**: 유지보수 가능한 프론트엔드를 위한 핵심 교리(key tenet)지요.

`ReactDOM.render()`는 최상위 컴포넌트의 인스턴스를 만들고, 두 번째 인수로 전달받은 DOM 엘리먼트에 마크업을 삽입해 프레임워크를 시작합니다.

`ReactDOM` 모듈은 DOM 특정 메소드를 노출해, `React`가 코어 툴을 다른 플렛폼(예를 들어, [React Native](http://facebook.github.io/react-native/))에 공유할 수 있게 합니다.

## 컴포넌트 조합하기

이제 `CommentList`와 `CommentForm`을 위한 뼈대를 구축해 봅시다. 이전과 마찬가지로 단순히 `<div>` 태그 하나 입니다. 파일에 두 컴포넌트를 추가해, 이미 있는 `CommentBox` 선언을 참고로 `ReactDOM.render`를 호출합시다.

```javascript
// tutorial2.js
var CommentList = React.createClass({
  render: function() {
    return (
      <div className="commentList">
        안녕! 난 댓글목록이야.
      </div>
    );
  }
});

var CommentForm = React.createClass({
  render: function() {
    return (
      <div className="commentForm">
        안녕! 난 댓글 폼이야.
      </div>
    );
  }
});
```

다음은 `CommentBox` 컴포넌트가 새로 만든 컴포넌트들을 사용하도록 수정합니다.

```javascript{6-8}
// tutorial3.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList />
        <CommentForm />
      </div>
    );
  }
});
```

방금 만든 컴포넌트들을 어떻게 HTML 태그들과 섞어 사용하는지 살펴보세요. HTML 컴포넌트들도 한가지 차이만 제외한다면 우리가 정의한 것과 같은 표준적인 React 컴포넌트입니다. JSX 컴파일러가 자동으로 HTML 태그들을 `React.createElement(tagName)` 표현식으로 재작성하고 나머지는 그대로 둘 것입니다. 이는 전역 네임스페이스가 오염되는 것을 막아줍니다.

### props 사용하기

부모로 부터 받은 데이터에 의존하는 `Comment` 컴포넌트를 만들어 봅시다. 부모 컴포넌트로 부터 받은 데이터는 자식 컴포넌트에서 '프로퍼티'로 사용가능 합니다.  이 '프로퍼티들'은 `this.props`를 통해 접근합니다.  props를 사용해, `CommentList`에서 전달받은 데이터를 읽어들이고, 마크업을 렌더할 수 있을 것입니다.


```javascript
// tutorial4.js
var Comment = React.createClass({
  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        {this.props.children}
      </div>
    );
  }
});
```

JSX 내부의 중괄호로 둘러싸인 JavaScript 표현식(어트리뷰트나 엘리먼트의 자식으로 사용된)을 통해 텍스트나 React 컴포넌트를 트리에 더할 수 있습니다. `this.props`를 통해 컴포넌트에 전달된 특정한 어트리뷰트들에, `this.props.children`을 통해 중첩된 엘리먼트들에 접근할 수 있습니다.

### 컴포넌트 프로퍼티 (Component Properties)

`Comment` 컴포넌트를 만들었으니, 여기에 글쓴이와 내용을 넘겨보도록 합시다. 이렇게 함으로써 각 고유한 comment에서 같은 코드를 재사용할 수 있습니다. 먼저 댓글 몇 개를 `CommentList`에 추가해 봅시다:

```javascript{6-7}
// tutorial5.js
var CommentList = React.createClass({
  render: function() {
    return (
      <div className="commentList">
        <Comment author="Pete Hunt">댓글입니다</Comment>
        <Comment author="Jordan Walke">*또 다른* 댓글입니다</Comment>
      </div>
    );
  }
});
```

부모 컴포넌트인 `CommentList`에서 자식 컴포넌트인 `Comment`에 데이터들을 전달하고 있는것을 확인할 수 있습니다. 예를 들어, 우리는 어트리뷰트로 *Pete Hunt*를, XML 형식의 자식 노드로 *댓글입니다*를 첫 번째 `Comment`로 넘겼습니다. 위에서 언급했듯이 `Comment` 컴포넌트는 그들의 '프로퍼티'를 `this.props.author`, `this.props.children`를 통해 접근합니다.

### Markdown 추가하기

Markdown은 텍스트를 포맷팅하는 간단한 방식입니다. 예를 들어, 별표(`*`)로 텍스트를 둘러싸는 것은 강조의 의미입니다.

먼저 서드파티 라이브러리인 **remarkable**를 애플리케이션에 추가합니다. 이 JavaScript 라이브러리는 Markdown 텍스트를 HTML 문법으로 변환해줍니다. head 태그안에 스크립트 태그를 추가해 주세요. (React playground에는 이미 포함되어 있습니다):

```html{9}
<!-- index.html -->
<head>
  <meta charset="utf-8" />
  <title>React Tutorial</title>
  <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
  <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
  <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  <script src="https://unpkg.com/jquery@3.1.0/dist/jquery.min.js"></script>
  <script src="https://unpkg.com/remarkable@1.6.2/dist/remarkable.min.js"></script>
</head>
```

다음은, 댓글 텍스트를 Markdown으로 전환하고 출력해 봅시다.

```javascript{4,10}
// tutorial6.js
var Comment = React.createClass({
  render: function() {
    var md = new Remarkable();
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        {md.render(this.props.children.toString())}
      </div>
    );
  }
});
```

우리가 한 일이라고는 remarkable 라이브러리를 호출한 것 뿐입니다. remarkable가 `this.props.children`에서 텍스트를 읽어들여 처리할 수 있도록 React 형식의 텍스트(React's wrapped text)를 단순 텍스트(raw string)으로 전환하기 위해 명시적으로 `toString()`을 호출했습니다.

하지만 여기엔 문제가 있습니다! 우리는 HTML 태그들이 정상적으로 렌더되길 원하지만 브라우저에 출력된 결과물은 "`<p>``<em>`또 다른`</em>` 댓글입니다`</p>`"처럼 태그가 그대로 보일것입니다.

React는 이런 식으로 [XSS 공격](https://en.wikipedia.org/wiki/Cross-site_scripting)을 예방합니다. 우회할 방법이 있긴 하지만 프레임워크는 사용하지 않도록 경고하고 있습니다:

```javascript{3-7,15}
// tutorial7.js
var Comment = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});
```

이는 의도적으로 생(raw) HTML을 넣기 힘들게 하려고 만든 특별한 API지만 remarkable를 사용하기 위해 이 백도어를 활용합시다.

**잊지 마세요:** 이 기능은 remarkable가 안전한 것으로 믿고 사용하는 것입니다.

### 데이터 모델 연결하기

지금까지는 소스코드에 직접 댓글을 넣었습니다. 이제부터는 JSON 데이터 덩어리를 댓글 목록에 렌더해보겠습니다. 최종적으로는 서버에서 데이터가 내려오겠지만, 지금은 소스에 직접 데이터를 넣어봅시다:

```javascript
// tutorial8.js
var data = [
  {author: "Pete Hunt", text: "댓글입니다"},
  {author: "Jordan Walke", text: "*또 다른* 댓글입니다"}
];
```

이 데이터를 모듈화된 방식으로 `CommentList`에 넣어야 합니다. props을 이용해 데이터를 넘기도록 `CommentBox`와 `ReactDOM.render()` 호출 코드를 수정합시다.

```javascript{7,15}
// tutorial9.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.props.data} />
        <CommentForm />
      </div>
    );
  }
});

ReactDOM.render(
  <CommentBox data={data} />,
  document.getElementById('content')
);
```

이제 `CommentList`에서 데이터를 다룰 수 있습니다. 댓글을 동적으로 렌더해봅시다:

```javascript{4-10,13}
// tutorial10.js
var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      return (
        <Comment author={comment.author} key={comment.id}>
          {comment.text}
        </Comment>
      );
    });
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});
```

이게 전부입니다!

### 서버에서 가져오기(Fetching)

이제 데이터를 소스에 직접 넣는 방식에서 서버에서 동적으로 받아서 처리하는 방식으로 바꿔봅시다. 데이터 prop을 삭제하고 처리할 URL로 변경해 줍시다.

```javascript{3}
// tutorial11.js
ReactDOM.render(
  <CommentBox url="/api/comments" />,
  document.getElementById('content')
);
```

이 컴포넌트는 이전 것과 다르게, 스스로 다시 렌더링해야 합니다. 컴포넌트는 서버에서 요청이 들어올때까지는 아무 데이터도 가지고 있지 않다가, 특정한 시점에서 새로운 댓글을 렌더할 필요가 있을 것입니다.

주의: 이 단계에서 코드는 아직 동작하지 않습니다.

### 반응적 state

지금까지, 각각의 컴포넌트는 props를 기반으로 한번 렌더되었습니다. `props`는 불변성을 갖습니다: 그것들은 부모에서 전달되어 부모에게 "소유" 되어 있습니다. 컴포넌트에 상호작용을 구현하기 위해서, 가변성을 갖는 **state**를 소개합니다. `this.state`는 컴포넌트에 한정(private)되며 `this.setState()`를 통해 변경할 수 있습니다. state가 업데이트 되면, 컴포넌트는 자신을 스스로 다시 렌더링합니다.

`render()` 메소드는 `this.props`와 `this.state`를 위한 함수로 선언적으로 작성됩니다. 프레임워크에서 입력값에 따른 UI가 항상 일관성 있음을 보장해줍니다.

서버가 데이터를 가져오면 댓글 데이터가 변경될 것입니다. 댓글 데이터의 배열을 `CommentBox`의 state로 추가해봅시다:

```javascript{3-5,10}
// tutorial12.js
var CommentBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm />
      </div>
    );
  }
});
```

`getInitialState()` 는 컴포넌트의 생명주기동안 한 번만 실행되며 컴포넌트의 초기 state를 설정합니다.

### state 업데이트하기

컴포넌트의 최초 생성 시에, 서버에서 GET 방식으로 JSON을 넘겨받아 최신의 데이터가 state에 반영되길 원했습니다. jQuery를 사용해 서버에 비동기 요청을 만들어 필요한 데이터를 빨리 가져올 수 있게 하겠습니다. 이런 식입니다.

```json
[
  {"author": "Pete Hunt", "text": "댓글입니다"},
  {"author": "Jordan Walke", "text": "*또 다른* 댓글입니다"}
]
```

```javascript{6-18}
// tutorial13.js
var CommentBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm />
      </div>
    );
  }
});
```

여기서 `componentDidMount`는 컴포넌트가 렌더링 된 다음 React에 의해 자동으로 호출되는 메소드입니다. 동적 업데이트의 핵심은 `this.setState()`의 호출입니다. 우리가 이전의 댓글 목록을 서버에서 넘어온 새로운 목록으로 변경하면 자동으로 UI가 업데이트 될 것입니다. 이 반응성 덕분에 실시간 업데이트에 아주 작은 수정만 가해집니다. 우리는 여기선 간단한 폴링을 사용할 것이지만 웹소켓등의 다른 기술도 쉽게 사용할 수 있습니다.

```javascript{3,15,20-21,35}
// tutorial14.js
var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm />
      </div>
    );
  }
});

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000} />,
  document.getElementById('content')
);

```

우리가 여기서 한것은 AJAX 호출을 별도의 메소드로 분리하고 컴포넌트가 처음 로드된 시점부터 2초 간격으로 계속 호출되도록 한 것입니다. 브라우저에서 직접 돌려보고 `comments.json` 파일(서버의 같은 디렉토리에 있습니다)을 수정해보세요. 2초 간격으로 변화되는 모습이 보일 것입니다!

### 새로운 댓글 추가하기

이제 폼을 만들어볼 시간입니다. 우리의 `CommentForm` 컴포넌트는 사용자에게 이름과 내용을 입력받고 댓글을 저장하기 위해 서버에 요청을 전송해야 합니다.

```javascript{5-9}
// tutorial15.js
var CommentForm = React.createClass({
  render: function() {
    return (
      <form className="commentForm">
        <input type="text" placeholder="이름" />
        <input type="text" placeholder="내용을 입력하세요..." />
        <input type="submit" value="올리기" />
      </form>
    );
  }
});
```

이제 폼의 상호작용을 만들어 보겠습니다. 사용자가 폼을 전송하는 시점에 우리는 폼을 초기화하고 서버에 요청을 전송하고 댓글목록을 업데이트해야 합니다. 폼의 submit 이벤트를 감시하고 초기화 해주는 부분부터 시작해 보죠.

```javascript{3-13,16-19}
// tutorial16.js
var CommentForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.refs.author.value.trim();
    var text = this.refs.text.value.trim();
    if (!text || !author) {
      return;
    }
    // TODO: 서버에 요청을 전송합니다
    this.refs.author.value = '';
    this.refs.text.value = '';
    return;
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="이름" ref="author" />
        <input type="text" placeholder="내용을 입력하세요..." ref="text" />
        <input type="submit" value="올리기" />
      </form>
    );
  }
});
```

##### 이벤트

React는 카멜케이스 네이밍 컨벤션으로 컴포넌트에 이벤트 핸들러를 등록합니다. 폼이 유효한 값으로 submit되었을 때 폼필드들을 초기화하도록 `onSubmit` 핸들러를 등록합니다.

폼 submit에 대한 브라우저의 기본동작을 막기 위해 이벤트시점에 `preventDefault()`를 호출합니다.

##### Refs

자식 컴포넌트의 이름을 지정하기 위해 `ref` 어트리뷰트를, DOM 노드를 참조하기 위해 `this.refs`를 사용합니다.

##### props으로 콜백 처리하기

사용자가 댓글을 등록할 때, 새로운 댓글을 추가하기 위해 댓글목록을 업데이트해주어야 합니다. `CommentBox`가 댓글목록의 state를 소유하고 있기 때문에 이 로직 또한 `CommentBox`에 있는것이 타당합니다.

자식 컴포넌트가 그의 부모에게 데이터를 넘겨줄 필요가 있습니다. 부모의 `render` 메소드에서 새로운 콜백(`handleCommentSubmit`)을 자식에게 넘겨주고, 자식의 `onCommentSubmit` 이벤트에 그것을 바인딩해주는 식으로 구현합니다. 이벤트가 작동될때(triggered)마다, 콜백이 호출됩니다:

```javascript{16-18,31}
// tutorial17.js
var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    // TODO: 서버에 요청을 수행하고 목록을 업데이트한다
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

사용자가 폼을 전송할 때, `CommentForm`에서 콜백을 호출해 봅시다:

```javascript{10}
// tutorial18.js
var CommentForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.refs.author.value.trim();
    var text = this.refs.text.value.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.refs.author.value = '';
    this.refs.text.value = '';
    return;
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="이름" ref="author" />
        <input type="text" placeholder="이름을 입력하세요..." ref="text" />
        <input type="submit" value="올리기" />
      </form>
    );
  }
});
```

이제 콜백이 제자리를 찾았습니다. 우리가 할 일은 서버에 요청을 날리고 목록을 업데이트하는 것 뿐입니다:

```javascript{17-28}
// tutorial19.js
var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

### 최적화: 낙관적 업데이트

우리의 애플리케이션은 이제 모든 기능을 갖추었습니다. 하지만 댓글이 목록에 업데이트되기 전에 완료요청을 기다리는 게 조금 느린듯한 느낌이 드네요. 우리는 낙관적 업데이트를 통해 댓글이 목록에 추가되도록 함으로써 앱이 좀 더 빨라진 것처럼 느껴지도록 할 수 있습니다.

```javascript{17-19,29}
// tutorial20.js
var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>댓글</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

### 축하합니다!

몇 단계를 거쳐 간단하게 댓글창을 만들어 보았습니다. [왜 React인가](/react/docs/why-react-ko-KR.html)에서 더 알아보거나, 혹은 [API 레퍼런스](/react/docs/top-level-api-ko-KR.html)에 뛰어들어 해킹을 시작하세요! 행운을 빕니다!
