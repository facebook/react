---
id: tutorial-ja-JP
title: チュートリアル
permalink: docs/tutorial-ja-JP.html
prev: getting-started-ja-JP.html
next: thinking-in-react-ja-JP.html
---

これから、シンプルながらも現実的なコメントボックスを作ってみましょう。ブログにも設置できるようなもので、Disqus や LiveFyre、Facebook comments が採用しているリアルタイムコメントの基本機能を備えたものを想定しています。

その機能とは次のようなものです。

* コメント全件の表示欄
* コメントの送信フォーム
* 自作のバックエンドとの連携機能

ついでに小洒落た機能もいくつか加えましょう。

* **コメントの先読み:** 送信したコメントをサーバに保存される前に表示させることで、アプリ動作の体感速度をアップさせます。
* **自動更新:** 他のユーザのコメントをリアルタイムで表示させます。
* **Markdown 記法:** ユーザが Markdown 記法でコメントを書けるようにします。

### 全部飛ばしてソースを見たいんだけど？

[全部 GitHub にあります。](https://github.com/reactjs/react-tutorial)

### サーバを動かす

このチュートリアルを始めるにあたっては必要ないですが、後半ではサーバに POST を投げる機能を追加します。サーバのことは良く知っていて自分でサーバを建てたいのであれば、それでも構いません。そうではないけれども、サーバサイドは考えずに React のことだけに焦点を絞って学びたい方のため、シンプルなサーバのソースコードを書いておきました。言語は JavaScript （Node.js）または Python、Ruby、Go、ないし PHP で用意してあり、すべて GitHub にあります。[ソースを見る](https://github.com/reactjs/react-tutorial/) ことも出来ますし、 [zip ファイルでダウンロード](https://github.com/reactjs/react-tutorial/archive/master.zip)することも出来ます。

それでは最初のチュートリアルとして、`public/index.html` の編集から始めましょう。

### 始めてみましょう

このチュートリアルでは、あらかじめビルドされた JavaScript ファイルを CDN から読み込むことになります。自分の好きなエディタを立ち上げて、次のように新規の HTML ドキュメントを作りましょう。

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>React Tutorial</title>
    <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
    <script src="https://unpkg.com/jquery@3.1.0/dist/jquery.min.js"></script>
    <script src="https://unpkg.com/remarkable@1.6.2/dist/remarkable.min.js"></script>

  </head>
  <body>
    <div id="content"></div>
    <script type="text/babel">
      // ここにコードが入ります
    </script>
  </body>
</html>
```

このチュートリアルに関しては、JavaScript コードを script タグの中へ書いていくことにします。

> 確認:
>
> 上のコードで jQuery を読み込んでいますが、これはチュートリアル後半で ajax のコードを簡潔に書きたいだけなので、React を動かすのに必要なものでは**ありません**。

### 最初のコンポーネント

React はすべて、モジュール単位で組み立てられる（composable）コンポーネントからなっています。今回取り上げるコメントボックスの例では、以下のようなコンポーネント構造をとります。

```
- CommentBox
  - CommentList
    - Comment
  - CommentForm
```

それではまず `CommentBox` コンポーネントから作っていきましょう。とは言っても単なる `<div>` です。

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

#### JSX シンタックス

先程書いた JavaScript の中に、XMLに似たシンタックスがあることに気付いたでしょうか。このシンタックスシュガーは、シンプルなプリコンパイラによって次のような生の JavaScript に変換されます。

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

どちらを採るかは自由ですが、生の JavaScript よりも JSX シンタックスのほうが扱いやすいと考えています。詳しくは [JSX シンタックスの記事](/react/docs/jsx-in-depth.html) を読んでみてください。

#### 何をしているのか

先程のコードでは、とあるメソッドを持った JavaScript オブジェクトを `React.createClass()` に渡しています。これは新しい React コンポーネントを作るためです。このメソッドは `render` と呼ばれており、最終的に HTML へレンダリングされる React コンポーネントのツリーを返す点が肝になります。

コードに書いた `<div>` タグは実際の DOM ノードではありません。これは React の `div` コンポーネントのインスタンスです。 これらは React が理解できるマーカーやデータの一部だと見なせます。React は **安全** です。デフォルトで XSS 対策を行っているので、HTML 文字列を生成することはありません。

実際の HTML を返す必要はありません。 自分が（もしくは他の誰かが）組み立てたコンポーネントツリーを返せばいいのです。 これこそ React が **composable**な（組み立てられる）ものである理由であり、この大事なルールを守ればフロントエンドはメンテナンスしやすいものとなります。

`ReactDOM.render()` はまずルートコンポーネントのインスタンスを作り、フレームワークを立ち上げます。そして、第2引数で与えられた実際の DOM 要素にマークアップを挿入します。

## コンポーネントの組み立て

それでは `CommentList` と `CommentForm` の骨組みを作りましょう。繰り返しになりますが、これらはただの `<div>` です。

```javascript
// tutorial2.js
var CommentList = React.createClass({
  render: function() {
    return (
      <div className="commentList">
        Hello, world! I am a CommentList.
      </div>
    );
  }
});

var CommentForm = React.createClass({
  render: function() {
    return (
      <div className="commentForm">
        Hello, world! I am a CommentForm.
      </div>
    );
  }
});
```

さて、この新しいコンポーネントを使えるように `CommentBox` コンポーネントを書き直しましょう。

```javascript{6-8}
// tutorial3.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList />
        <CommentForm />
      </div>
    );
  }
});
```

ここで、HTML タグと組み立てているコンポーネントが、どのようにミックスされているかを確認しましょう。 HTML コンポーネントは既定の React コンポーネントですが、自分で定義したもの同士はそれぞれ別物になります。JSX コンパイラは HTML タグを自動的に `React.createElement(tagName)` の式に書き換え、それぞれを別々のものに変換します。これはグローバルの名前空間が汚染させるのを防ぐためです。

### Props を使う

次のステップは `Comment` コンポーネントの作成です。このコンポーネントは、自分の親にあたるコンポーネントから渡されたデータを扱います。親から渡されたデータは、子のコンポーネントで「プロパティ」として利用できます。この「プロパティ」には `this.props` を通してアクセスします。props（プロパティ）を使うと `CommentList` から `Comment` に渡されたデータの読み込み、マークアップのレンダリングが可能になります。

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

JSX の内側で（属性値または子要素として）JavaScript の式を波括弧で囲むと、テキストや React コンポーネントをツリーに加えることが出来ます。コンポーネントに渡された属性値には名前が付けられており、`this.props` をキーとしてアクセスできます。また、ネストされた子要素の値は `this.props.children` でアクセスが可能です。

### コンポーネントのプロパティ

さて、これまでに `Comment` コンポーネントを定義しました。これからこのコンポーネントに、コメントの著者名と内容を渡せるようにします。これを実装することで、それぞれ別のコメントに対して同じコードを使い回せるようになります。それでは早速 `CommentList` の中にコメントを追加していきましょう。

```javascript{6-7}
// tutorial5.js
var CommentList = React.createClass({
  render: function() {
    return (
      <div className="commentList">
        <Comment author="Pete Hunt">This is one comment</Comment>
        <Comment author="Jordan Walke">This is *another* comment</Comment>
      </div>
    );
  }
});
```

ここで確認してもらいたいのは、親の `CommentList` コンポーネントから、子の `Comment` コンポーネントにデータが渡されている点です。この例ではまず、*Pete Hunt*（属性値を通して）と *This is one comment*（XML のような子ノードを通して）といったデータを `Comment` コンポーネントに渡しています。少し前に確認した通り、`Comment` コンポーネントからこれらの「プロパティ」にアクセスするには、`this.props.author` と `this.props.children` を使います。

### Markdown の追加

Markdown はインラインでテキストをフォーマットする簡単な記法です。例えば、テキストをアスタリスクで挟むと強調されて表示されます。

まず最初に、サードパーティ製の **remarkable** ライブラリをアプリケーションに追加します。 remarkable は Markdown テキストを生の HTML に変換する JavaScript ライブラリです。 既にある head タグの内側に script タグを書き込み、以下のように remarkable を読み込ませます。

```html{9}
<!-- index.html -->
<head>
  <meta charset="UTF-8" />
  <title>Hello React</title>
  <script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
  <script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
  <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  <script src="https://unpkg.com/jquery@3.1.0/dist/jquery.min.js"></script>
  <script src="https://unpkg.com/remarkable@1.6.2/dist/remarkable.min.js"></script>
</head>
```

次に、Markdown で書かれたコメントを変換して出力してみましょう。

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

このコードでは remarkable のライブラリを呼び出すことしかしていません。`this.props.children` は React によってラップされたテキストですが、これを remarkable が理解できる生の文字列に変換する必要があります。そのため、上のコードでは明示的に `toString()` を呼び出しているのです。

しかし問題があります！ブラウザがレンダリングしたコメントは次のように表示されているはずです -- "`<p>`This is `<em>`another`</em>` comment`</p>`" このようなタグは実際に HTML としてレンダリングさせたいですね。

このような現象が起きるのは React が XSS 攻撃に対する防御を行っているからです。これを回避する方法はありますが、それを使うときにはフレームワークが警告をします。

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

これは特別な API であり、生の HTML が挿入されにくくなるよう意図的に作ったものです。しかし、ここでは remarkable のためにこのバックドアを利用しています。

**注意:** この機能を使うことで、remarkable は安全なものと信頼することになります。

### データモデルとの連携

これまではソースコードにコメントを直に書き込んでいました。その代わりに、これからは JSON の blob データをコメントリストにレンダリングしてみましょう。サーバからデータを取得するのが最後の目標ですが、とりあえず今はソースコードの中にデータを書いておくことにします。

```javascript
// tutorial8.js
var data = [
  {id: 1, author: "Pete Hunt", text: "This is one comment"},
  {id: 2, author: "Jordan Walke", text: "This is *another* comment"}
];
```

このデータはモジュールを使って `CommentList` に取り込む必要があります。`CommentBox` の `ReactDOM.render()` の部分を手直しして、props を通してデータが `CommentList` へ渡るようにしましょう。

```javascript{7,15}
// tutorial9.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
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

こうして `CommentList` がデータを扱えるようになりました。それでは、コメントを動的にレンダリングしてみましょう。

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

これだけ！

### サーバからのデータの取得

続いて、ハードコーディングしていたデータを、サーバからの動的なデータに置き換えてみましょう。

```javascript{3}
// tutorial11.js
ReactDOM.render(
  <CommentBox url="/api/comments" />,
  document.getElementById('content')
);
```

このコンポーネントは自身を再びレンダリングすることになるので、これまでのコンポーネントとは異なります。レスポンスがサーバから返ってくると、送られてきた新しいコメントをコンポーネントがレンダリングすることになります。ですが、その時点までコンポーネントには何もデータがないはずです。

確認: 上のコードは、このステップではまだ動きません。

### Reactive state

これまで、それぞれのコンポーネントは自身の props の値を用いて、一度だけレンダリングしていました。`props` はイミュータブルです。つまり、props は親から渡されますが、同時に props は親の「所有物」なのです。データが相互にやり取りされるのを実現するため、ここでミュータブルな **state**（状態）をコンポーネントに取り入れましょう。コンポーネントは `this.state` というプライベートな値を持ち、`this.setState()` を呼び出すことで state を更新することが出来ます。コンポーネントの state が更新されれば、そのコンポーネントは自身を再びレンダリングし直します。

`render()` メソッドは `this.props` や `this.state` と同じく宣言的に書かれています。このフレームワークによって、UI と入力が常に一致するようになります。

サーバがデータを集めてくれば、今あるコメントのデータを更新することになるかもしれません。state を表すコメントのデータの配列を `CommentBox` コンポーネントに加えましょう。

```javascript{3-5,10}
// tutorial12.js
var CommentBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm />
      </div>
    );
  }
});
```

`getInitialState()` メソッドはコンポーネントのライフサイクル内で一回だけ実行され、コンポーネントの state における初期値を設定します。

#### State の更新
コンポーネントの作成と同時に、サーバから JSON データを GET で取得し、state を更新して最新のデータを反映させてみましょう。実際のアプリケーションでは動的なエンドポイントになるでしょうが、今回の例では話を簡単にするため、以下の静的な JSON ファイルを使います。

```json
[
  {"id": "1", "author": "Pete Hunt", "text": "This is one comment"},
  {"id": "2", "author": "Jordan Walke", "text": "This is *another* comment"}
]
```

サーバへの非同期リクエストを作るため、ここでは jQuery を使います。

注意: ここからは AJAX アプリケーションを作っていくので、自分のファイルシステム上ではなく Web サーバを使ってアプリを作る必要があります。残りのチュートリアルに必要な機能は [冒頭で紹介した](#running-a-server) サーバに含まれています。ソースコードは [GitHub に](https://github.com/reactjs/react-tutorial/)用意してあります。

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
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm />
      </div>
    );
  }
});
```

さて、`componentDidMount` はコンポーネントがレンダリングされたときに React が自動的に呼び出すメソッドです。動的な更新の鍵となるのは `this.setState()` の呼び出し方です。ここでは、古いコメントの配列をサーバから取ってきた新しい配列に置き換え、UI を自動的に更新させてみましょう。このような reactivity（反応性・柔軟性）のおかげで、リアルタイム更新を最小限にすることが出来ます。次のコードではシンプルなポーリングをしていますが、WebSockets や他の方法でも簡単に実現できます。

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
        <h1>Comments</h1>
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

ここまでに、AJAX を呼び出す部分を別のメソッド内に移動させました。加えて、コンポーネントが最初に読み込まれてから2秒ごとに AJAX のメソッドが呼び出されるようにしました。ぜひ自分のブラウザで実行させて、`comments.json` ファイルに変更を加えてみてください。2秒以内に表示が更新されるはずです！

### 新しいコメントの追加

いよいよフォームを作る段階に来ました。ここで `CommentForm` コンポーネントは、ユーザに自分の名前とコメントの内容を入力させ、コメントを保存するためにサーバにリクエストを送信する必要があります。

```javascript{5-9}
// tutorial15.js
var CommentForm = React.createClass({
  render: function() {
    return (
      <form className="commentForm">
        <input type="text" placeholder="Your name" />
        <input type="text" placeholder="Say something..." />
        <input type="submit" value="Post" />
      </form>
    );
  }
});
```

#### 制御コンポーネント

このチュートリアルの DOM は、`input` 要素がレンダリングされ、ブラウザが状態（そのレンダリングされた値）を管理します。その結果、実際のDOMの状態がコンポーネントとは異なります。ビューの状態がコンポーネントとは異なり、これは理想的ではありません。React では、コンポーネントは初期化の時点だけでなく、常にビューの状態を表している必要があります。

したがって、ユーザの入力を保存するために `this.state` を使用することになります。2つのプロパティの`author`と`text`に最初の`state`を定義して、空の文字列を設定します。`<input>`の要素では、`onChange`にハンドラをアタッチすると`value` に `state` が反映される。これらの `<input>` の要素は、`value` が設定された制御コンポーネントと呼ばれています。制御コンポーネントの詳細についてはこちらの[Forms article](/react/docs/forms.html#controlled-components)をご覧ください。

```javascript{3-11,15-26}
// tutorial16.js
var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  render: function() {
    return (
      <form className="commentForm">
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});
```

#### イベント

React イベントハンドラのアタッチはコンポーネントにキャメルケースの命名規則を使用します。2つの`<input>`要素に`onChange`のハンドラをアタッチします。今、ユーザーの入力は`<input>`フィールド、アタッチされた`onChange`がコールバックされてコンポーネントの` state`が変更されます。その後、`input`要素のレンダリングされた値は、現在のコンポーネント` state`を反映するように更新されます。

(賢明な読者は、説明したようにこれらのイベントハンドラが動作することを驚かれるかもしれない、明示的な結合を不要にそのコンポーネントインスタンスへの各メソッドは、メソッドの参照が明示的に`this`. `React.createClass(...)` [automatically binds](/react/docs/interactivity-and-dynamic-uis.html#under-the-hood-autobinding-and-event-delegation)にバインドされていないことを自動的に結合する与えられました。)

#### フォーム送信

フォームを対話型にしましょう。ユーザーがフォームを送信すると、それをクリアする必要があります。サーバに要求を送信すると、コメントのリストを更新します。開始するとフォームの送信イベントでクリアするか試しましょう。

```javascript{12-21,24}
// tutorial17.js
var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    // TODO: サーバーに要求を送信
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});
```

フォームが有効な入力でサブミットされたときにフォームフィールドをクリアし、フォームに`onSubmit`ハンドラをアタッチします。

`preventDefault()` はフォームを送信するイベントにブラウザのデフォルトのアクションを防ぐためにコールします。

#### Props としてのコールバック

ユーザがコメントを送信したら、コメントリストをリフレッシュして新しいリストを読み込むことになります。コメントリストを表す state を保持しているのは `CommentBox` なので、必要なロジックは `CommentBox` の中に書くのが筋でしょう。

ここでは子のコンポーネントから親に向かって、いつもとは逆方向にデータを返す必要があります。まず、親のコンポーネントに新しいコールバック関数（`handleCommentSubmit`）を定義します。続いて `render` メソッド内にある子のコンポーネントにコールバックを渡すことで、`onCommentSubmit` イベントとコールバックを結び付けています。こうすることで、イベントが発生するたびにコールバックが呼び出されます。

```javascript{16-18,31}
// tutorial18.js
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
    // TODO: submit to the server and refresh the list
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
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

今、`CommentBox`は`onCommentSubmit`をpropして`CommentForm`にコールバックを利用した、ユーザーがフォームを送信したときに`CommentForm`はコールバックを呼び出すことができます。

```javascript{19}
// tutorial19.js
var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});
```

こうしてコールバックが出来たので、あとはサーバにコメントを送信してリストをリフレッシュすれば完璧です。

```javascript{17-28}
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
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

### 最適化: 先読み更新

アプリケーションに必要な機能は一通り実装できました。しかし、フォームからコメントを送信しても、サーバからのレスポンスが来るまで自分のコメントはリストに載らないため、アプリの動作は遅く感じます。ここでは、送信したコメントをリストに先読みさせて、アプリの体感速度をアップさせましょう。

```javascript{17-23,33}
// tutorial21.js
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
    // Optimistically set an id on the new comment. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    comment.id = Date.now();
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
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});
```

### おめでとう！

シンプルな手順を追ううちにコメントボックスを作ることが出来ました。さらに詳しいことは[なぜ React を使うのか](/react/docs/why-react.html)を読んだり、[API リファレンス](/react/docs/top-level-api.html)を開いたりしてハッキングを始めましょう！幸運を祈ります！
